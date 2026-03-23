const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.bikxqwylzlzcqulpmsmi:24431809Henok@aws-1-eu-west-1.pooler.supabase.com:5432/postgres'
});

client.connect()
  .then(() => {
    console.log('Connected natively via pg!');
    return client.query('SELECT 1');
  })
  .then(() => client.end())
  .catch(err => console.error('Connection error', err.stack));
