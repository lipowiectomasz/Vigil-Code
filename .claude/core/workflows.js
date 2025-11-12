/**
 * Centralized Workflow Registry
 * Single source of truth for all orchestrator workflow definitions
 */

module.exports = {
  PATTERN_ADDITION: {
    name: 'Pattern Addition Workflow',
    parallel_capable: false,
    steps: [
      { agent: 'vg-test-automation', action: 'create_test', parallel: false, icon: '🧪' },
      { agent: 'vg-test-automation', action: 'run_test', parallel: false, icon: '▶️' },
      { agent: 'vg-workflow-business-logic', action: 'add_pattern', parallel: false, icon: '⚙️' },
      { agent: 'vg-test-automation', action: 'verify_test', parallel: false, icon: '✅' }
    ]
  },

  PII_ENTITY_ADDITION: {
    name: 'PII Entity Addition Workflow',
    parallel_capable: false,
    steps: [
      { agent: 'vg-pii-detection', action: 'analyze_entity', parallel: false, icon: '🔍' },
      { agent: 'vg-workflow-business-logic', action: 'update_config', parallel: false, icon: '⚙️' },
      { agent: 'vg-test-automation', action: 'test_pii', parallel: false, icon: '✅' }
    ]
  },

  SECURITY_AUDIT: {
    name: 'Security Audit Workflow',
    parallel_capable: true,
    steps: [
      { agent: 'vg-security-compliance', action: 'npm_audit', parallel: true, icon: '🔍' },
      { agent: 'vg-security-compliance', action: 'secret_scan', parallel: true, icon: '🔐' },
      { agent: 'vg-security-compliance', action: 'redos_check', parallel: true, icon: '🎯' },
      { agent: 'vg-security-compliance', action: 'auth_review', parallel: true, icon: '🛡️' }
    ]
  },

  TEST_EXECUTION: {
    name: 'Test Execution Workflow',
    parallel_capable: false,
    steps: [
      { agent: 'vg-test-automation', action: 'run_suite', parallel: false, icon: '▶️' },
      { agent: 'vg-test-automation', action: 'analyze_results', parallel: false, icon: '📊' }
    ]
  },

  SERVICE_DEPLOYMENT: {
    name: 'Service Deployment Workflow',
    parallel_capable: false,
    steps: [
      { agent: 'vg-infrastructure-deployment', action: 'build_containers', parallel: false, icon: '🔨' },
      { agent: 'vg-infrastructure-deployment', action: 'deploy_service', parallel: false, icon: '🚀' },
      { agent: 'vg-infrastructure-deployment', action: 'health_check', parallel: false, icon: '❤️' }
    ]
  }
};
