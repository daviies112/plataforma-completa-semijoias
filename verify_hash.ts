
import bcrypt from 'bcryptjs';
const hash = "$2b$12$jk5UbzVmtRsTUUG4.PpWhOk1ga.vBYBu8EZDCy1G.KkNxIIeJ1u2cW";
const password = "Gabriel15@";

const main = async () => {
  const match = await bcrypt.compare(password, hash);
  console.log('PASSWORD_SUCCESS:', match);
};

main();
