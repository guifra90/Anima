// execution/scoro/get-project-status.js
// Scopo: recupera stato attuale di un progetto da Scoro
// Input: { projectId: string }
// Output: { id, name, status, budget_used, budget_total, overdue_tasks }
// Errori: PROJECT_NOT_FOUND, SCORO_API_UNAVAILABLE

// Mock helper or real client integration logic
const scoroClient = {
  getProject: async (projectId) => {
    // This is a placeholder for the actual Scoro API call
    // In a real scenario, this would use fetch or an SDK
    if (projectId === 'error') throw { code: 500, message: 'API Error' };
    if (projectId === '404') throw { code: 404, message: 'Not Found' };
    
    return {
      id: projectId,
      name: 'Project ' + projectId,
      status: 'In Progress',
      budget_used: 5000,
      budget_total: 10000,
      tasks: [
        { id: 1, name: 'Task 1', is_overdue: true },
        { id: 2, name: 'Task 2', is_overdue: false }
      ]
    };
  }
};

async function getProjectStatus(input) {
  const { projectId } = input;
  
  if (!projectId) {
    throw new Error('PROJECT_ID_REQUIRED');
  }
  
  try {
    const project = await scoroClient.getProject(projectId);
    return {
      id: project.id,
      name: project.name,
      status: project.status,
      budget_used: project.budget_used,
      budget_total: project.budget_total,
      overdue_tasks: project.tasks.filter(t => t.is_overdue).length
    };
  } catch (err) {
    if (err.code === 404) throw new Error('PROJECT_NOT_FOUND');
    throw new Error(`SCORO_API_UNAVAILABLE: ${err.message}`);
  }
}

module.exports = { getProjectStatus };
// If run directly for testing
if (require.main === module) {
    getProjectStatus({ projectId: '123' })
        .then(console.log)
        .catch(console.error);
}
