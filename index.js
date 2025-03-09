import express from 'express';
import knex from 'knex';
const app = express();

const db = knex({
  client: 'sqlite3',
  connection: {
    filename: 'database.sqlite3', 
  },
  useNullAsDefault: true
});  

app.use(express.json());


app.post('/comptes', async (req, res) => {
  const { nom } = req.body;

  if (!nom) {
    return res.status(400).json({ error: 'El nombre del cuenta es requerido' });
  }

  try {
    await db('accounts').insert({ accountOwner: nom, accountSolde: 0 });

    res.status(201).json({ message: 'Cuenta creada con éxito' });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear la cuenta' });
  }
});

app.get('/comptes', async (req, res) => {
  try {
    const accounts = await db('accounts').select('*');
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener las cuentas' });
  }
});

app.delete('/reset', async (req, res) => {
  try {
    await db('accounts').delete();
    res.status(200).json({ message: 'Base de datos reseteada con éxito' });
  } catch (error) {
    res.status(500).json({ error: 'Error al resetear la base de datos' });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});