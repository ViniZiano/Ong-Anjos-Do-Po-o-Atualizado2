const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

(async () => {
  try {
    const base = path.join(__dirname, '..'); // adote-um-animal-main
    const DB_FILE = path.join(base, 'data.sqlite');
    const JSON_FILE = path.join(base, 'db.json');
    const MIGRATION_SQL = path.join(base, 'migrations', 'init.sql');

    if (!fs.existsSync(JSON_FILE)) {
      console.error('Arquivo db.json não encontrado em:', JSON_FILE);
      process.exit(1);
    }

    // Abre/Cria o arquivo SQLite
    const db = new Database(DB_FILE);

    // Executa migrations se existirem (cria tabelas)
    if (fs.existsSync(MIGRATION_SQL)) {
      const sql = fs.readFileSync(MIGRATION_SQL, 'utf8');
      db.exec(sql);
      console.log('Migrations aplicadas:', MIGRATION_SQL);
    } else {
      console.warn('migrations/init.sql não encontrado. Verifique:', MIGRATION_SQL);
    }

    // Lê o JSON e extrai animals
    const raw = JSON.parse(fs.readFileSync(JSON_FILE, 'utf8'));
    const animals = Array.isArray(raw.animals) ? raw.animals : (raw || []);

    if (!animals.length) {
      console.log('Nenhum animal encontrado para migrar.');
      process.exit(0);
    }

    // Prepara o insert (mapeando campos esperados pelo schema)
    const insert = db.prepare(`INSERT INTO pets
      (nome,categoria,tipo,idade,genero,tamanho,localizacao,imagem,descricao,caracteristicas,
       necessidades,em_par,multiplos,urgente,vacinado,castrado,created_at)
      VALUES (@nome,@categoria,@tipo,@idade,@genero,@tamanho,@localizacao,@imagem,@descricao,@caracteristicas,
        @necessidades,@em_par,@multiplos,@urgente,@vacinado,@castrado,@created_at)`);

    const insertMany = db.transaction((items) => {
      let count = 0;
      for (const p of items) {
        const caracteristicas = Array.isArray(p.caracteristicas) ? JSON.stringify(p.caracteristicas) :
                                 (typeof p.caracteristicas === 'string' && p.caracteristicas ? JSON.stringify(p.caracteristicas.split(',').map(s=>s.trim())) : JSON.stringify([]));
        insert.run({
          nome: p.nome || p.name || '',
          categoria: p.categoria || p.categoria || '',
          tipo: p.tipo || p.tipo || '',
          idade: p.idade || p.idade || '',
          genero: p.genero || p.genero || (p.genero === undefined ? '' : String(p.genero)),
          tamanho: p.tamanho || p.porte || 'todos',
          localizacao: p.local || p.localizacao || '',
          imagem: p.imagem || p.image || '',
          descricao: p.descricao || p.description || '',
          caracteristicas,
          necessidades: p.necessidades ? 1 : 0,
          em_par: p.emPar ? 1 : 0,
          multiplos: p.multiplos ? 1 : 0,
          urgente: p.urgente ? 1 : 0,
          vacinado: p.vacinado ? 1 : 0,
          castrado: p.castrado ? 1 : 0,
          created_at: p.createdAt || p.created_at || new Date().toISOString()
        });
        count++;
      }
      return count;
    });

    const migrated = insertMany(animals);
    console.log(`Migração concluída: ${migrated} registros inseridos em ${DB_FILE}`);
    db.close();
    process.exit(0);
  } catch (err) {
    console.error('Erro na migração:', err);
    process.exit(1);
  }
})();