/**
 * SkillRegistry - Central service to manage and provide tools to ANIMA agents.
 */

const fs = require('fs');
const path = require('path');
const SkillParser = require('../utils/skill-parser');

class SkillRegistry {
  constructor(rootPath = null) {
    // If no path is provided, we try to find the 'skills' folder in the project root
    this.rootPath = rootPath || 
                    process.env.ANIMA_SKILLS_PATH || 
                    path.resolve(process.cwd(), 'skills');
    
    // Fallback support for the old relative path if the previous logic fails to find a directory
    if (!fs.existsSync(this.rootPath)) {
      const fallbackPath = path.resolve(__dirname, '../../../../skills');
      if (fs.existsSync(fallbackPath)) {
        this.rootPath = fallbackPath;
      }
    }
    this.skills = new Map();
  }

  /**
   * Scans the skills directory and registers all skills found.
   */
  async scan() {
    console.log(`[SkillRegistry] SCANSIONE IN CORSO: ${this.rootPath}`);
    if (!fs.existsSync(this.rootPath)) {
      console.warn(`[SkillRegistry] ERRORE: Directory skills non trovata: ${this.rootPath}`);
      return;
    }

    // List main subdirectories (system, operational, etc.)
    const categories = fs.readdirSync(this.rootPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory());

    for (const category of categories) {
      const categoryPath = path.join(this.rootPath, category.name);
      
      // List skill directories in each category
      const skillDirs = fs.readdirSync(categoryPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory());

      for (const skillDir of skillDirs) {
        const skillPath = path.join(categoryPath, skillDir.name);
        const skillMdPath = path.join(skillPath, 'SKILL.md');
        const toolsJsonPath = path.join(skillPath, 'tools.json');

        if (fs.existsSync(skillMdPath)) {
          try {
            const parsed = SkillParser.parse(skillMdPath);
            const skillName = parsed.metadata.name || skillDir.name;
            const namespace = category.name;
            const namespacedName = `${namespace}:${skillName}`;

            // Tool definitions (from tools.json if exists, else from metadata)
            let tools = [];
            if (fs.existsSync(toolsJsonPath)) {
              tools = JSON.parse(fs.readFileSync(toolsJsonPath, 'utf8'));
            } else if (parsed.metadata.tools) {
              // TODO: Simple tool parsing from frontmatter if we want to support it
            }

            this.skills.set(namespacedName, {
              id: namespacedName,
              name: skillName,
              namespace: namespace,
              description: parsed.metadata.description || '',
              instructions: parsed.instructions,
              tools: tools,
              path: skillPath
            });

            console.log(`[SkillRegistry] Skill registrata: ${namespacedName}`);
          } catch (err) {
            console.error(`[SkillRegistry] Errore parsing skill in ${skillPath}:`, err.message);
          }
        }
      }
    }
  }

  /**
   * Returns all registered skills.
   */
  getAllSkills() {
    return Array.from(this.skills.values());
  }

  /**
   * Returns a specific skill by its namespaced name.
   */
  getSkill(namespacedId) {
    return this.skills.get(namespacedId);
  }

  /**
   * Returns all tools from all skills in a format suitable for LLM adapters.
   */
  getToolsForAgent() {
    const tools = [];
    for (const skill of this.skills.values()) {
      if (skill.tools && Array.isArray(skill.tools)) {
        tools.push(...skill.tools);
      }
    }
    return tools;
  }
}

module.exports = SkillRegistry;
