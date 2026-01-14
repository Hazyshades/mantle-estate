# Prices

Mantle Estate uses a comprehensive price calculation system for different regional markets. Prices are updated **daily** and track changes in residential real estate prices in real-time.

## Data Sources by Region

### United States (US Markets)

For US markets, data from **Zillow** — the largest real estate portal in the United States — is used.

**Key Features:**
- Daily price updates
- Data covers a wide range of property types
- Integration with real-world real estate market

### Europe (European Markets)

For European markets, combinations of official government indices, real estate market reports, and economic databases are used.

**Data Sources:**
- **London**: Land Registry (official transaction registry) with hedonic quality and location adjustments
- **Paris**: INSEE and Notaires de France — Secondary housing price index
- **Berlin**: Destatis (Federal Statistical Office) and GREIX (Kiel Institute)
- **Dubai**: REIDIN and ValuStrat with hedonic adjustments (DLD – Dubai Land Department)

**Methodology:**
- Quarterly or annual data are interpolated to monthly values
- Prices in local currency are converted to USD using average monthly exchange rates
- Hedonic methods are used to account for quality/location
- Prices reflect a blend of apartments/condominiums and houses

**Overview:**
Monthly average residential property prices for European cities were derived from a combination of official government indices, real estate market reports, and economic databases. Prices represent a blend of apartments/condos and houses (where data allows), focusing on urban residential averages. Data for 2025–2026 includes forecasts extrapolated from recent trends (e.g., Q3–Q4 2025).

- **Data Aggregation**: Quarterly or annual data from sources was interpolated to monthly values using linear trends
- **Currency Conversion**: Local currency prices were converted to USD using average monthly exchange rates (from sources like Reuters or FRED)
- **Adjustments**: Where sqm prices were given, average property sizes were applied (e.g., 60–80 m² for apartments) based on city-specific reports. Forecasts account for inflation and market trends
- **Source Selection**: Priority was given to official sources (government statistics) and reputable analysts; data was cross-verified for consistency. Hedonic methods or indices were used to account for quality/location
- **Limitations**: Averages vary by segment (new vs. existing); luxury outliers are not included. Forecasts assume stable trends without major shocks

### APAC (Asia-Pacific Markets)

For Asia-Pacific markets, combinations of official government indices, real estate market reports, and economic databases are used.

**Major Cities and Sources:**

#### Tokyo, Japan
- Japan Real Estate Institute (JREI)
- Ministry of Land, Infrastructure, Transport and Tourism (MLIT)
- Hedonic quality adjustments

**Methodology**: Based on JREI surveys and MLIT indices, which use transaction data adjusted for quality (hedonic method). Prices in JPY/sqm converted to full property (avg 70 sqm condo) and USD. 2025 projections from YoY growth (e.g., 8–12% in Tokyo metro). Interpolation from quarterly BIS data.

#### Singapore
- Urban Redevelopment Authority (URA) Private Residential Property Price Index
- Transaction data with hedonic adjustments
- Includes HDB flats and condos

**Methodology**: URA Private Residential Property Price Index, based on transaction caveats (hedonic-adjusted for attributes). Includes HDB flats and condos. SGD to USD conversion; monthly from quarterly data. 2025 forecast uses 0.9% Q3 growth, projecting 4–5% annual.

#### Hong Kong
- Rating and Valuation Department (RVD)
- Classification by size (A–E)
- Transaction data (repeat-sales/hedonic)

**Methodology**: RVD classifies by size (A–E), using transaction data (repeat-sales/hedonic). HKD/sqm to full property (avg 50 sqm), USD conversion. 2025 uses 1.13% YoY rise, with Q2 index interpolation.

#### Shanghai, China
- National Bureau of Statistics (NBS)
- CREIS index
- 70-city survey with transaction data

**Methodology**: NBS and CREIS use 70-city survey (transaction-based, hedonic). RMB/sqm to full (80 sqm avg), USD. 2025 forecast: -2.4% YoY drop, interpolated from monthly.

#### Sydney, Australia
- ABS (Australian Bureau of Statistics)
- CoreLogic hedonic indices
- Median prices

**Methodology**: ABS and CoreLogic use hedonic indices from sales data. Median AUD prices to USD; monthly from quarterly. 2025: 4–5% rise projection, with $23k Q3 increase.

#### Seoul, South Korea
- Korea Real Estate Board
- KB Kookmin Bank
- Transaction surveys with hedonic adjustments

**Methodology**: Korea Real Estate Board and KB Kookmin Bank use transaction surveys (hedonic). KRW to USD; monthly from quarterly. 2025: 0.7% YoY, with 5.9% projection adjustment.

**APAC Methodology Overview:**
The monthly average residential property prices in the CSV were derived from a combination of official government indices, real estate market reports, and economic databases. Prices represent a blend of apartments/condos and houses (where data allows), focusing on urban residential averages.

- **Data Aggregation**: Quarterly or annual data from sources was interpolated to monthly values using linear trends. For incomplete periods (e.g., pre-2018 blanks in CSV), no data was filled as per available historicals
- **Currency Conversion**: Local currency prices were converted to USD using average monthly exchange rates from sources like FRED or Trading Economics
- **Adjustments**: Where sqm prices were given, assumed average property sizes (e.g., 60–80 sqm for apartments) based on city-specific reports. 2025 data includes projections from mid-year trends, extrapolated linearly from latest available (e.g., Q3 2025)
- **Sources Selection**: Prioritized official (e.g., government stats) and reputable analysts; cross-verified for consistency. Hedonic or index-based methods adjust for quality/location
- **Limitations**: Averages vary by segment (new vs. existing); no luxury outliers included. Projections assume stable trends without major shocks

## How Price Changes Are Calculated

Mantle Estate uses next methodology: a real estate price index that updates **daily** and tracks price changes in real-time across different markets (web sites, reports, online ads).

Unlike traditional indices like Case-Shiller (which uses only repeat sales of single-family homes, monthly, with months of lag), our system includes **all types of transactions** (including new construction, condos, townhouses, multi-family homes) and strives for maximum timeliness.

### 1. Data Sources

**Primary Sources:**
- Sales records from county registrars, official registries, historical transaction data

**Additional Sources:**
- Timely sources, such as active listings (sales listings), which strongly correlate with final sale prices (correlation coefficient ~0.89). This allows accounting for fresher information, compensating for delays in official sales (from 2 weeks to 6 months)

### 2. Data Cleaning and Filtering

**Cleaning:**
- Duplicate removal
- Address standardization
- Area and other parameter verification

**Outlier Filtering:**
- Only transactions in the **35–65th percentiles** of price distribution are used
- This avoids the influence of ultra-expensive or ultra-cheap properties
- Reduces distortions from market skewness

### 3. Daily Price Calculation

**Methodology:**
1. **Rolling median** price per sqm/ft is calculated using a dynamic time window backwards
2. Window adjusts automatically:
   - Shorter in active markets with high transaction volume
   - Longer in sparse markets (to gather sufficient data)
3. Timely data (listings) are added to historical sales with **exponential weights**:
   - More weight to recent observations
   - Historical influence is preserved
4. Final smoothed price — combination of these components + **7-day smoothing** to minimize noise

### 4. Price Changes

Price changes are simply the difference in daily median price per sqm/ft from day to day (or over a period).

**Benefits:**
- Daily data updates
- Listing integration allows the index to respond to market shifts much faster than monthly indices
- No seasonal adjustment (to avoid lags and artificial distortions)

### 5. Revisions and Quality

- Index is tested daily for anomalies (sharp spikes, source issues)
- Data is revised when necessary
- Accuracy is verified by correlation with traditional indices (e.g., Case-Shiller for US, where applicable)

## Result

Price changes in Mantle Estate reflect real market trends based on:
- All available transactions
- Fresh signals from listings
- Strong smoothing for stability
- Daily updates

This allows seeing whether prices are rising in a specific city today, rather than waiting months.
