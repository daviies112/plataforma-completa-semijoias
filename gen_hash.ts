
import bcrypt from 'bcryptjs';
const password = "Gabriel15@";

const main = async () => {
  const hash = await bcrypt.hash(password, 12);
  console.log('NEW_HASH:', hash);
};

main();
