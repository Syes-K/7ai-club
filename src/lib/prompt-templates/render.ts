const PLACEHOLDER_RE = /\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g;

export function collectPlaceholderNames(template: string): string[] {
  const re = new RegExp(PLACEHOLDER_RE.source, "g");
  const names: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(template)) !== null) {
    names.push(m[1]);
  }
  return names;
}

export function renderTemplateString(
  template: string,
  vars: Record<string, string | number>
): string {
  return template.replace(PLACEHOLDER_RE, (_full, name: string) => {
    if (!Object.prototype.hasOwnProperty.call(vars, name)) {
      throw new Error(`renderTemplateString: missing variable "${name}"`);
    }
    return String(vars[name]);
  });
}
