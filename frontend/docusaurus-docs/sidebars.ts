import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    {
      type: 'doc',
      id: 'intro',
      label: 'Introduction',
    },
    {
      type: 'category',
      label: 'Protocol',
      items: [
        'protocol/overview',
        'protocol/prices',
        'protocol/funding-rate',
        'protocol/trading',
      ],
    },
    {
      type: 'category',
      label: 'Formulas and Calculations',
      items: [
        'formulas/index-price',
        'formulas/funding-rate',
        'formulas/fill-price',
        'formulas/pnl',
      ],
    },
    {
      type: 'category',
      label: 'Contracts',
      items: [
        'contracts/overview',
      ],
    },
  ],
};

export default sidebars;
