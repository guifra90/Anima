const SkillRegistry = require('./execution/services/skill-registry');
const path = require('path');

async function testRegistry() {
  const registry = new SkillRegistry(path.resolve(__dirname, './skills'));
  await registry.scan();
  
  const skills = registry.getAllSkills();
  console.log('--- Skills Registrate ---');
  skills.forEach(s => {
    console.log(`- ${s.id} (${s.tools.length} tool)`);
  });

  const scoro = registry.getSkill('operational:scoro');
  if (scoro) {
    console.log('\n--- Istruzioni Scoro ---');
    console.log(scoro.instructions.slice(0, 100) + '...');
  }

  const tools = registry.getToolsForAgent();
  console.log('\n--- Tool Totali ---');
  console.log(JSON.stringify(tools, null, 2));
}

testRegistry().catch(console.error);
