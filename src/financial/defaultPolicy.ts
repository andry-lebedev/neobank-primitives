import { createPolicyEngine } from './policy'

export const INTERACTIVE_AGENT_ID = 'interactive_user'

export function createInteractivePolicy() {
  return createPolicyEngine({
    agents: {
      [INTERACTIVE_AGENT_ID]: {
        allowedCurrencies: ['EUR', 'USD', 'GBP', 'USDC', 'USDT'],
        allowedRails: ['sepa', 'stablecoin_transfers'],
        approvedDestinations: ['rcpacct_01', 'rcpacct_nw1'],
        blockedDestinations: [],
        allowedApprovers: ['account_owner'],
        perOperationLimit: 10_000,
        periodLimit: 50_000,
        spentInPeriod: 0,
      },
    },
  })
}
