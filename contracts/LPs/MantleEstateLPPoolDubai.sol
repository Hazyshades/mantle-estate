// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title MantleEstateCityLPPool
 * @notice City-specific LP pool that accepts USDC-like tokens (6 decimals) and mints LP shares (6 decimals).
 * @dev MVP model: pricePerShare = totalLiquidity / totalShares.
 *      - totalLiquidity is the on-chain token balance of this contract.
 *      - totalShares is the ERC20 totalSupply() of LP shares.
 *
 * IMPORTANT:
 * - This contract is intentionally minimal. It is a custody + shares accounting layer.
 * - Future trading/fees/PnL integration can be done by transferring tokens in/out:
 *   - collecting fees/losses: transfer tokens into the pool (increases share price)
 *   - paying trader profits: transfer tokens out of the pool (decreases share price)
 */
contract MantleEstateCityLPPool is ERC20, Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ============ State Variables ============

    /// @notice USDC token address (6 decimals on Mantle Sepolia in your setup)
    IERC20 public immutable usdcToken;

    /// @notice City identifier (e.g., bytes32("DXB"))
    bytes32 public immutable cityCode;

    /// @notice Human-readable city name
    string public cityName;

    /// @notice Minimum deposit amount (10 USDC with 6 decimals)
    uint256 public minDepositAmount = 10 * 10 ** 6;

    /// @notice Maximum deposit amount (1,000,000 USDC with 6 decimals)
    uint256 public maxDepositAmount = 1_000_000 * 10 ** 6;

    /// @notice Operators can move funds in/out for future fee/PnL settlement
    mapping(address => bool) public isOperator;

    // ============ Events ============

    event OperatorUpdated(address indexed operator, bool enabled);
    event CityNameUpdated(string oldName, string newName);
    event DepositLimitsUpdated(uint256 oldMin, uint256 newMin, uint256 oldMax, uint256 newMax);

    event Deposited(address indexed user, uint256 amountIn, uint256 sharesMinted, uint256 pricePerShareAfter);
    event Withdrawn(address indexed user, uint256 sharesBurned, uint256 amountOut, uint256 pricePerShareAfter);

    event OperatorCollected(address indexed operator, uint256 amountIn, uint256 pricePerShareAfter);
    event OperatorPaidOut(address indexed operator, address indexed to, uint256 amountOut, uint256 pricePerShareAfter);

    // ============ Errors ============

    error InvalidToken();
    error InvalidCityCode();
    error InvalidAmount();
    error DepositTooSmall();
    error DepositTooLarge();
    error SlippageExceeded();
    error InsufficientLiquidity();
    error NotOperator();
    error InvalidRecipient();

    // ============ Constructor ============

    /**
     * @param _usdcToken USDC-like token contract address (6 decimals)
     * @param _cityCode City code, e.g., bytes32("DXB")
     * @param _cityName City name, e.g., "Dubai"
     * @param _lpName ERC20 name for LP shares
     * @param _lpSymbol ERC20 symbol for LP shares
     */
    constructor(
        address _usdcToken,
        bytes32 _cityCode,
        string memory _cityName,
        string memory _lpName,
        string memory _lpSymbol
    ) ERC20(_lpName, _lpSymbol) Ownable(msg.sender) {
        if (_usdcToken == address(0)) revert InvalidToken();
        if (_cityCode == bytes32(0)) revert InvalidCityCode();

        usdcToken = IERC20(_usdcToken);
        cityCode = _cityCode;
        cityName = _cityName;

        // Deployer is operator by default
        isOperator[msg.sender] = true;
        emit OperatorUpdated(msg.sender, true);
    }

    // ============ ERC20 Overrides ============

    /**
     * @notice LP share decimals set to 6 to match USDC and simplify UX.
     */
    function decimals() public pure override returns (uint8) {
        return 6;
    }

    // ============ View Functions ============

    /**
     * @notice Current pool liquidity measured as on-chain USDC balance.
     */
    function totalLiquidity() public view returns (uint256) {
        return usdcToken.balanceOf(address(this));
    }

    /**
     * @notice Current price per share in USDC units (6 decimals).
     * @dev If no shares exist, price is 1.0 USDC per share.
     */
    function pricePerShare() public view returns (uint256) {
        uint256 ts = totalSupply();
        if (ts == 0) return 1 * 10 ** 6;
        return (totalLiquidity() * (10 ** 6)) / ts;
    }

    /**
     * @notice Preview how many shares would be minted for a given deposit.
     */
    function previewDeposit(uint256 amountIn) public view returns (uint256 sharesOut) {
        if (amountIn == 0) return 0;
        uint256 ts = totalSupply();
        uint256 tl = totalLiquidity();
        if (ts == 0 || tl == 0) return amountIn; // 1 share = 1 USDC initially
        return (amountIn * ts) / tl;
    }

    /**
     * @notice Preview how much USDC would be returned for burning shares.
     */
    function previewWithdraw(uint256 sharesIn) public view returns (uint256 amountOut) {
        if (sharesIn == 0) return 0;
        uint256 ts = totalSupply();
        if (ts == 0) return 0;
        return (sharesIn * totalLiquidity()) / ts;
    }

    // ============ User Functions ============

    /**
     * @notice Deposit USDC and receive LP shares.
     * @param amountIn USDC amount (6 decimals)
     * @param minSharesOut Slippage protection: minimum shares to mint
     */
    function deposit(uint256 amountIn, uint256 minSharesOut) external nonReentrant whenNotPaused returns (uint256 sharesOut) {
        if (amountIn == 0) revert InvalidAmount();
        if (amountIn < minDepositAmount) revert DepositTooSmall();
        if (amountIn > maxDepositAmount) revert DepositTooLarge();

        sharesOut = previewDeposit(amountIn);
        if (sharesOut == 0) revert InvalidAmount(); // rounding to zero protection
        if (sharesOut < minSharesOut) revert SlippageExceeded();

        // Pull funds first, then mint shares
        usdcToken.safeTransferFrom(msg.sender, address(this), amountIn);
        _mint(msg.sender, sharesOut);

        emit Deposited(msg.sender, amountIn, sharesOut, pricePerShare());
        return sharesOut;
    }

    /**
     * @notice Burn LP shares and withdraw underlying USDC.
     * @param sharesIn Shares to burn (6 decimals)
     * @param minAmountOut Slippage protection: minimum USDC amount to receive
     */
    function withdraw(uint256 sharesIn, uint256 minAmountOut) external nonReentrant whenNotPaused returns (uint256 amountOut) {
        if (sharesIn == 0) revert InvalidAmount();

        amountOut = previewWithdraw(sharesIn);
        if (amountOut == 0) revert InvalidAmount();
        if (amountOut < minAmountOut) revert SlippageExceeded();

        // Ensure pool has enough USDC (should always hold if accounting matches)
        if (amountOut > totalLiquidity()) revert InsufficientLiquidity();

        _burn(msg.sender, sharesIn);
        usdcToken.safeTransfer(msg.sender, amountOut);

        emit Withdrawn(msg.sender, sharesIn, amountOut, pricePerShare());
        return amountOut;
    }

    // ============ Operator Functions (Fees / PnL settlement hooks) ============

    modifier onlyOperator() {
        if (!isOperator[msg.sender]) revert NotOperator();
        _;
    }

    /**
     * @notice Operator pulls USDC into the pool (e.g., fees, trader losses).
     * @dev Operator must approve the pool before calling.
     */
    function operatorCollect(uint256 amountIn) external onlyOperator nonReentrant whenNotPaused {
        if (amountIn == 0) revert InvalidAmount();
        usdcToken.safeTransferFrom(msg.sender, address(this), amountIn);
        emit OperatorCollected(msg.sender, amountIn, pricePerShare());
    }

    /**
     * @notice Operator pays USDC out of the pool (e.g., trader profits).
     */
    function operatorPayout(address to, uint256 amountOut) external onlyOperator nonReentrant whenNotPaused {
        if (to == address(0)) revert InvalidRecipient();
        if (amountOut == 0) revert InvalidAmount();
        if (amountOut > totalLiquidity()) revert InsufficientLiquidity();

        usdcToken.safeTransfer(to, amountOut);
        emit OperatorPaidOut(msg.sender, to, amountOut, pricePerShare());
    }

    // ============ Admin Functions ============

    function setOperator(address operator, bool enabled) external onlyOwner {
        isOperator[operator] = enabled;
        emit OperatorUpdated(operator, enabled);
    }

    function setCityName(string calldata newName) external onlyOwner {
        string memory old = cityName;
        cityName = newName;
        emit CityNameUpdated(old, newName);
    }

    function setDepositLimits(uint256 newMin, uint256 newMax) external onlyOwner {
        uint256 oldMin = minDepositAmount;
        uint256 oldMax = maxDepositAmount;
        minDepositAmount = newMin;
        maxDepositAmount = newMax;
        emit DepositLimitsUpdated(oldMin, newMin, oldMax, newMax);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Emergency USDC withdrawal (admin only).
     * @dev Use only for emergencies; this breaks LP share backing.
     */
    function emergencyWithdrawUSDC(address to, uint256 amount) external onlyOwner {
        if (to == address(0)) revert InvalidRecipient();
        if (amount == 0) revert InvalidAmount();
        usdcToken.safeTransfer(to, amount);
    }
}

/**
 * @title MantleEstateLPPoolDubai
 * @notice Preconfigured LP pool for Dubai (DXB).
 * @dev Deploy one instance per city.
 */
contract MantleEstateLPPoolDubai is MantleEstateCityLPPool {
    constructor(address _usdcToken)
        MantleEstateCityLPPool(
            _usdcToken,
            bytes32("DXB"),
            "Dubai",
            "Mantle Estate LP - Dubai",
            "meLP-DXB"
        )
    {}
}
