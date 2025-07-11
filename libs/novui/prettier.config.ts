import type { Config } from 'prettier';
import rootConfig from '../../prettier.config.js';

const config: Config = {
  ...rootConfig,
  plugins: ['@pandabox/prettier-plugin'],
};

export default config;
