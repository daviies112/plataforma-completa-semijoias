const fs = require('fs');
const path = 'c:\\\\Users\\\\davie\\\\Downloads\\\\Skill e mcp\\\\loja\\\\plataformacompleta-store-update-20260214-165922\\\\plataformacompleta\\\\server\\\\routes\\\\formularios-complete.ts';
let content = fs.readFileSync(path, 'utf8');

const t1 = "res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');";
const t2 = "res.set('Cache-Control', 'max-age=300, s-maxage=600, stale-while-revalidate=300, public');";
const c = content.split(t1).join("").split(t2).join("");

let header = `  const setPublicFormNoCache = (res: any) => {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
  };\n\n`;

content = c.replace(/app\.get\("\/api\/forms\/public\/:id", async \(req, res\) => \{\n\s*try \{\n\s*const formIdOrSlug = req\.params\.id;/g, `${header}app.get("/api/forms/public/:id", async (req, res) => {\n    try {\n      setPublicFormNoCache(res);\n      const formIdOrSlug = req.params.id;`);

content = content.replace(/app\.get\("\/api\/forms\/public\/by-slug\/:companySlug\/:formSlug", async \(req, res\) => \{\n\s*try \{\n\s*const \{ companySlug, formSlug \} = req\.params;/g, `app.get("/api/forms/public/by-slug/:companySlug/:formSlug", async (req, res) => {\n    try {\n      setPublicFormNoCache(res);\n      const { companySlug, formSlug } = req.params;`);

content = content.replace(/app\.get\("\/api\/forms\/public\/by-form-slug\/:formSlug", async \(req, res\) => \{\n\s*try \{\n\s*const \{ formSlug \} = req\.params;/g, `app.get("/api/forms/public/by-form-slug/:formSlug", async (req, res) => {\n    try {\n      setPublicFormNoCache(res);\n      const { formSlug } = req.params;`);

fs.writeFileSync(path, content, 'utf8');
console.log('REPLACEMENTS APPLIED!');
