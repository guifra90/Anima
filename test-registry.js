const SkillRegistry = require('./frontend/src/execution/services/skill-registry');
const path = require('path');

async function testRegistry() {
  // Use absolute path for skills to avoid directory resolution issues
  const skillsPath = path.resolve(__dirname, './skills');
  console.log(`[TEST] Inizializzazione SkillRegistry con path: ${skillsPath}`);
  
  const registry = new SkillRegistry(skillsPath);
  await registry.scan();
  
  const skills = registry.getAllSkills();
  console.log('\n--- Skills Registrate ---');
  if (skills.length === 0) {
    console.log('⚠️  Nessuna skill trovata. Verifica la struttura della cartella /skills.');
  }
  
  skills.forEach(s => {
    console.log(`- ${s.id} (${s.tools.length} tool)`);
  });

  const scoro = registry.getSkill('operational:scoro');
  if (scoro) {
    console.log('\n--- Istruzioni Scoro (Preview) ---');
    console.log(scoro.instructions.slice(0, 100) + '...');
  }

  const tools = registry.getToolsForAgent();
  console.log('\n--- Tool Totali Disponibili ---');
  console.log(`Conteggio: ${tools.length}`);
}

testRegistry().catch(err => {
  console.error('\n❌ Errore durante il test del registry:', err.message);
  process.exit(1);
});
