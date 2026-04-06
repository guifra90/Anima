const ScoroClient = require('../utils/scoro-client');
const CredentialRegistry = require('../utils/credential-registry');

/**
 * Scoro Executor for ANIMA.
 * Integrates with the unified Scoro client for operational tasks.
 */
async function run(toolName, args, credentialsOrAgentId) {
  let scoroCreds;

  if (typeof credentialsOrAgentId === 'string' && credentialsOrAgentId.length > 0) {
    // Interpret as agentId and resolve via registry
    scoroCreds = await CredentialRegistry.resolve(credentialsOrAgentId, 'scoro');
  } else {
    // Legacy / Direct object mode
    scoroCreds = credentialsOrAgentId;
  }

  // Merge with .env defaults for local discovery if still not resolved
  const finalCreds = {
    apiKey: scoroCreds?.apiKey || process.env.SCORO_API_KEY,
    companyId: scoroCreds?.companyId || process.env.SCORO_COMPANY_ACCOUNT_ID,
    baseUrl: scoroCreds?.baseUrl || process.env.SCORO_API_URL
  };
  
  if (!finalCreds.apiKey) {
    throw new Error(`MISSING_CREDENTIALS: No Scoro API Key found for agent or in environment.`);
  }

  const client = new ScoroClient(finalCreds);
  
  // Scoro standard response wrapper for ANIMA
  const wrap = (data, meta = {}) => ({
    agent_id: 'scoro-executor',
    timestamp: new Date().toISOString(),
    status: data ? 'success' : 'failed',
    output: {
      summary: `Eseguito tool: ${toolName}`,
      data: data || {},
    },
    metadata: {
      tool: toolName,
      ...meta
    }
  });

  console.log(`[SCORO-EXECUTOR] Executing: ${toolName}`, args);

  switch (toolName) {
    case 'list_projects': {
      const projects = await client.listProjects(args.limit || 20);
      return wrap(projects.map(p => ({
        id: p.project_id || p.id,
        name: p.project_name || p.name || 'Untitled Project',
        status: p.status,
        deadline: p.deadline
      })));
    }

    case 'get_project_details': {
      const project = await client.getProject(args.projectId);
      if (!project) return wrap(null, { error: 'PROJECT_NOT_FOUND' });
      
      return wrap({
        id: project.project_id || project.id,
        name: project.project_name || project.name,
        status: project.status,
        budget: project.budget || project.sum_total || 0,
        completed_budget: project.completed_budget || 0,
        margin: project.margin || 0,
        overdue: project.deadline && new Date(project.deadline) < new Date(),
        deadline: project.deadline
      });
    }

    case 'get_tasks': {
      const tasks = await client.getTasks(args.projectId, args.limit || 30);
      return wrap(tasks.map(t => ({
        id: t.task_id || t.id,
        name: t.task_name || t.event_name || t.name,
        status: t.status,
        is_overdue: t.deadline && new Date(t.deadline) < new Date(),
        assignee: t.user?.name || t.user_name || 'Unassigned'
      })));
    }

    case 'get_financial_summary': {
      // Scoro V2 uses 'sum' or 'sum_total' for invoice amounts
      const invoices = await client.getInvoices(args.limit || 50);
      const summary = {
        total_invoiced: invoices.reduce((acc, inv) => acc + (parseFloat(inv.sum || inv.sum_total || 0)), 0),
        pending_invoices: invoices.filter(inv => inv.status !== 'paid').length,
        items: invoices.map(inv => ({ 
          id: inv.invoice_id || inv.id, 
          company: inv.company_name, 
          total: inv.sum || inv.sum_total || 0, 
          status: inv.status 
        }))
      };
      return wrap(summary);
    }

    case 'get_revenue_report': {
      const { startDate, endDate, monthName } = args;
      const filter = {
        date: { from: startDate, to: endDate }
      };

      const [invoices, orders] = await Promise.all([
        client.getInvoices(100, filter),
        client.getOrders(100, filter)
      ]);

      const report = {
        month: monthName || startDate.substring(0, 7),
        actual_revenue: invoices.reduce((acc, inv) => acc + parseFloat(inv.sum || inv.sum_total || 0), 0),
        confirmed_orders: orders.reduce((acc, ord) => acc + parseFloat(ord.sum || ord.sum_total || 0), 0),
        invoice_count: invoices.length,
        order_count: orders.length,
        top_clients: invoices.slice(0, 5).map(inv => ({
          client: inv.company_name,
          amount: inv.sum || inv.sum_total
        })),
        details: {
          paid: invoices.filter(i => i.status === 'paid').reduce((acc, inv) => acc + parseFloat(inv.sum || inv.sum_total || 0), 0),
          pending: invoices.filter(i => i.status !== 'paid').reduce((acc, inv) => acc + parseFloat(inv.sum || inv.sum_total || 0), 0)
        }
      };

      return wrap(report);
    }

    case 'get_time_entries': {
      const entries = await client.getTimeEntries(args.projectId, args.limit || 20);
      return wrap(entries.map(e => ({
        id: e.time_entry_id || e.id,
        user: e.user_name || e.user?.name,
        duration: e.duration,
        activity: e.activity_name || e.activity,
        date: e.date
      })));
    }

    default:
      throw new Error(`TOOL_NOT_IMPLEMENTED: scoro:${toolName}`);
  }
}

module.exports = { run };
