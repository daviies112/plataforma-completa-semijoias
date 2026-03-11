
import fs from 'fs';
import path from 'path';

const base64Icon = 'iVBORw0KGgoAAAANSUhEUgAAAgAAAAIACAYAAAD0eNT6AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH6AMXDA0vE7/m8QAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLm3CYAAACXpUWHRSYXdfcHJvZmlsZV90eXBlAGV4aWYAAHja7ZpZkhw5DET/8xS9BBySg+fK9XoDffz8AsosWWXWVE6p6pEslVpEgQBA7A0M8PzP7/7Nf++/9K9atWvL67W069NfVf31m3xV/fWlfHX5VfN6Le369FdVf/0mX1V/fSlfXX7VvF5Luz79VdVfv8lX1V9fyleXXzWv19KuT39V9ddv8lX115fy1eVXzeu1tOvTX1X99Zt8Vf31pXx1+VXzeq3t+vRXVX/9Jl9Vf30pX11+1bxer762vL7v+vW++ur68vvv/v359vnr/q/79vnr/q/79vnr/q/79vnr/q/79vnr/q/79vnr/q/79vnr/q/79vnr/q/79vnr/q/79vnr/q/79vnr/q/79vnr/q/7yvL6uuvX++ur68vvv/v359vnr/q/7tvnr/q/7tvnr/q/7tvnr/q/7tvnr/q/7tvnr/q/7tvnr/q/7tvnr/q/7tvnr/q/7tvnr/q/7tvnr/q/7tvnr/q/7uv77v/7v/4H';

function generateIcons() {
  const iconsDir = path.join(process.cwd(), 'public', 'icons');
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  const buf = Buffer.from(base64Icon, 'base64');

  fs.writeFileSync(path.join(iconsDir, 'icon-192x192.png'), buf);
  fs.writeFileSync(path.join(iconsDir, 'icon-512x512.png'), buf);

  console.log('✅ Icons generated successfully in public/icons/');
}

generateIcons();
