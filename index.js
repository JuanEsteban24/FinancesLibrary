import express from 'express';
import knex from 'knex';
const app = express();

// Configuration de la base de données avec SQLite
const db = knex({
  client: 'sqlite3',
  connection: {
    filename: './accounts.sqlite3', // Fichier de la base de données
  },
  useNullAsDefault: true // Utilisation de la valeur NULL comme valeur par défaut
});

app.use(express.json()); // Middleware pour analyser les requêtes JSON

// Route pour créer un nouveau compte
app.post('/comptes', async (req, res) => {
  const { nom } = req.body;

  // Vérifier si le nom est fourni
  if (!nom) {
    return res.status(400).json({ error: 'Le nom du compte est requis' });
  }

  try {
    // Insérer un nouveau compte avec un solde de 0
    await db('accounts').insert({ accountOwner: nom, accountSolde: 0 });
    res.status(201).json({ message: 'Compte créé avec succès' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la création du compte' });
  }
});

// Route pour obtenir la liste de tous les comptes
app.get('/comptes', async (req, res) => {
  try {
    // Sélectionner tous les comptes
    const accounts = await db('accounts').select('*');
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des comptes' });
  }
});

// Route pour réinitialiser la base de données (supprimer toutes les données)
app.delete('/reset', async (req, res) => {
  try {
    // Supprimer toutes les données des comptes et des transactions
    await db('accounts').delete();
    await db('transactions').delete();
    res.status(200).json({ message: 'Base de données réinitialisée avec succès' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la réinitialisation de la base de données' });
  }
});

// Route pour créer une nouvelle transaction
app.post('/transactions', async (req, res) => {
  const { montant, from_account, to_account, date, comment } = req.body;

  // Vérifier que le montant est positif
  if (!montant || montant <= 0) {
    return res.status(400).json({ error: 'Le montant doit être positif' });
  }

  // Vérifier que les comptes d'origine et de destination sont fournis
  if (!from_account || !to_account) {
    return res.status(400).json({ error: 'Les comptes d\'origine et de destination sont requis' });
  }

  // Vérifier que la date est au bon format (YYYY-MM-DD)
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'La date doit être au format YYYY-MM-DD' });
  }

  try {
    // Vérifier si les comptes d'origine et de destination existent
    const fromExists = await db('accounts').where('accountOwner', from_account).first();
    const toExists = await db('accounts').where('accountOwner', to_account).first();

    if (!fromExists || !toExists) {
      return res.status(400).json({ error: 'Les comptes d\'origine ou de destination n\'existent pas' });
    }

    // Insérer la transaction dans la base de données
    await db('transactions').insert({ montant, from_account, to_account, date, comment });
    res.status(201).json({ message: 'Transaction créée avec succès' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la création de la transaction' });
  }
});

// Route pour récupérer toutes les transactions
app.get('/transactions', async (req, res) => {
  try {
    // Sélectionner toutes les transactions
    const transactions = await db('transactions').select('*');
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des transactions' });
  }
});

// Route pour mettre à jour une transaction existante
app.put('/transactions/:id', async (req, res) => {
  const { id } = req.params;
  const { montant, from_account, to_account, date, comment } = req.body;

  // Vérifier que le montant est positif
  if (!montant || montant <= 0) {
    return res.status(400).json({ error: 'Le montant doit être positif' });
  }

  // Vérifier que les comptes d'origine et de destination sont fournis
  if (!from_account || !to_account) {
    return res.status(400).json({ error: 'Les comptes d\'origine et de destination sont requis' });
  }

  // Vérifier que la date est au bon format (YYYY-MM-DD)
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'La date doit être au format YYYY-MM-DD' });
  }

  try {
    // Vérifier si les comptes d'origine et de destination existent
    const fromExists = await db('accounts').where('accountOwner', from_account).first();
    const toExists = await db('accounts').where('accountOwner', to_account).first();

    if (!fromExists || !toExists) {
      return res.status(400).json({ error: 'Les comptes d\'origine ou de destination n\'existent pas' });
    }

    // Mettre à jour la transaction existante
    await db('transactions').where('id', id).update({ montant, from_account, to_account, date, comment });
    res.status(200).json({ message: 'Transaction mise à jour avec succès' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la transaction' });
  }
});

// Route pour récupérer les transactions d'un compte spécifique
app.get('/transactions/:compte', async (req, res) => {
  const { compte } = req.params;

  try {
    // Sélectionner toutes les transactions impliquant le compte
    const transactions = await db('transactions').where('from_account', compte).orWhere('to_account', compte);
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des transactions du compte' });
  }
});

// Route pour récupérer le solde d'un compte à une date donnée
app.get('/comptes/:compte/solde', async (req, res) => {
  const { compte } = req.params;
  const { date } = req.query;

  try {
    // Récupérer toutes les transactions liées au compte
    const transactions = await db('transactions').where(function() {
      this.where('from_account', compte).orWhere('to_account', compte);
    });

    let solde = 0;

    // Calculer le solde en fonction des transactions et de la date
    transactions.forEach(transaction => {
      if (transaction.date <= date) {
        if (transaction.from_account === compte) {
          solde -= transaction.montant;
        } else if (transaction.to_account === compte) {
          solde += transaction.montant;
        }
      }
    });

    res.json({ solde });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération du solde du compte' });
  }
});

// Démarrer le serveur sur le port 3000
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Serveur en cours d'exécution sur http://localhost:${PORT}`);
});
