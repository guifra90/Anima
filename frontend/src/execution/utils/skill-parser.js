/**
 * SkillParser - Parser for ANIMA SKILL.md files (Paperclip format).
 * Extracts YAML frontmatter and markdown body.
 */

const fs = require('fs');
const path = require('path');

class SkillParser {
  /**
   * Parse a SKILL.md file and return its structure.
   * @param {string} filePath - Path to the SKILL.md file.
   */
  static parse(filePath) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File non trovato: ${filePath}`);
    }

    const content = fs.readFileSync(filePath, 'utf8');
    return this.parseContent(content);
  }

  /**
   * Parse the raw string content of a SKILL.md file.
   * @param {string} content 
   */
  static parseContent(content) {
    const normalized = content.replace(/\r\n/g, '\n');
    
    // Frontmatter extraction
    if (!normalized.startsWith('---\n')) {
      return {
        metadata: {},
        instructions: normalized.trim()
      };
    }

    const closingIndex = normalized.indexOf('\n---\n', 4);
    if (closingIndex < 0) {
      return {
        metadata: {},
        instructions: normalized.trim()
      };
    }

    const frontmatterRaw = normalized.slice(4, closingIndex).trim();
    const instructions = normalized.slice(closingIndex + 5).trim();
    
    const metadata = this.parseYamlSimple(frontmatterRaw);

    return {
      metadata,
      instructions
    };
  }

  /**
   * Simple YAML parser for frontmatter (key: value).
   * Supports basic scalars and descriptions.
   * @param {string} yaml 
   */
  static parseYamlSimple(yaml) {
    const lines = yaml.split('\n');
    const result = {};
    let lastKey = null;

    for (const line of lines) {
      if (!line.trim() || line.startsWith('#')) continue;

      const separatorIndex = line.indexOf(':');
      if (separatorIndex > 0) {
        const key = line.slice(0, separatorIndex).trim();
        let value = line.slice(separatorIndex + 1).trim();

        // Handle multi-line value (e.g. description: >)
        if (value === '>' || value === '|') {
          lastKey = key;
          result[key] = '';
          continue;
        }

        // Remove quotes if present
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        } else if (value.startsWith("'") && value.endsWith("'")) {
          value = value.slice(1, -1);
        }

        result[key] = value;
        lastKey = null;
      } else if (lastKey) {
        // Continue multi-line value
        result[lastKey] += (result[lastKey] ? ' ' : '') + line.trim();
      }
    }

    return result;
  }
}

module.exports = SkillParser;
