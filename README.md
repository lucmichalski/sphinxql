# sphinxql

[![Build Status](https://travis-ci.org/SiroDiaz/sphinxql.svg?branch=develop)](https://travis-ci.org/SiroDiaz/sphinxql)
[![paypal](https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=3XKLA6VTYVSKW&source=url)

SphinxQL query builder for Node.JS wrote in Typescript. Make easy queries avoiding
to write raw SphinxQL strings always that you can. By default, it uses escaped query parameters, always
thinking in security.

It is heavily inspired in the PHP [SphinxQL-Query-Builder](https://github.com/FoolCode/SphinxQL-Query-Builder) 
and also the Eloquent query builder (Laravel framework ORM)

The client used for create connection is [mysql2](https://github.com/sidorares/node-mysql2) that is focused
in performance.

## requirements

TODO

## install

Just run the npm command:
```bash
npm install --save sphinxql
```

## usage

To create a simple connection (not the most recommended, use a pool connection)
and write your first query, just do this:

```javascript
const sphinxql = require('sphinxql');

const sphql = sphinxql.createConnection({
  host: 'localhost',
  port: 9306
});

sphql.getQueryBuilder()
  .select('*')
  .from('books')
  .match('title', 'harry potter')
  .where('created_at', '<',  Expression.raw('YEAR()'))
  .between(Expression.raw(`YEAR(created_at)`), 2014, 2019)
  .orderBy({'date_published': 'ASC', 'price': 'DESC'})
  .limit(10)
  .execute()
  .then((result, fields) => {
    console.log(result);
  })
  .catch(err => {
    console.log(err);
  });
```

### SELECT

This section is separated in many parts but if you have used SphinxQL before or SQL you can
see this section also very basic for you. Anyway i recommend strongly to read the Manticore Search or Sphinx documentation
for making a good idea of how to use this API.

#### WHERE and MATCH methods

- where(columnExpr: string, operator: string, value?: any)
- whereIn(column: string, values: any[])
- whereNotIn(column: string, values: any[])
- between(column: string, value1: any, value2: any)
- match(fields: string[] | string, value: string, escapeValue: boolean = true)
- orMatch(fields: string[] | string, value: string, escapeValue: boolean = true)

Example here:
```javascript
sphql.getQueryBuilder()
  .select('id', 'author_id', 'publication_date')
  .from('books')
  .match('*', '"harry potter"', false)
  .whereIn('lang', ['en', 'sp', 'fr'])
  .between(Expression.raw(`YEAR(publication_date)`), 2008, 2015)
  .execute()
  .then((result, fields) => {
    console.log(result);
  })
  .catch(err => {
    console.log(err);
  });
```

#### OPTION
You can chain multiple options using the method "option".
The method head is:

- option(option: string, value: any)
where value argument can be an instance of:
- **Expression** instance for unescaped parameters
- **key-value object** (example below)
- **string** for simple and escaped option value.

Example with OPTION:
```javascript
sphql.getQueryBuilder()
  .select('id', 'author_id', 'publication_date')
  .from('books')
  .match('*', '"harry potter"', false)
  .between(Expression.raw(`YEAR(publication_date)`), 2008, 2015)
  .orderBy({'publication_date': 'ASC', 'price': 'DESC'})
  .limit(10)
  .option('rank_fields', 'title content')
  .option('field_weights', {title: 100, content: 1})
  .execute()
  .then((result, fields) => {
    console.log(result);
  })
  .catch(err => {
    console.log(err);
  });
```

#### Faceted search
// TODO

### INSERT
An INSERT statement is created like this:
```javascript
const document = {
  id: 1,
  content: 'this is the first post for the blog...',
  title: 'First post'
};

connection.getQueryBuilder()
  .insert('my_rtindex', document)
  .execute()
  .then((result, fields) => {
    console.log(result);
  })
  .catch(err => {
    console.log(err);
  });
```

Or using an array of key-value pairs to insert multiple values in the same query
```javascript
const document = [{
  id: 1,
  content: 'this is the first post for the blog...',
  title: 'First post'
}, {
  id: 2,
    content: 'this is the second post for the blog...',
    title: 'Second post'
}];

connection.getQueryBuilder()
  .insert('my_rtindex', document)
  .execute()
  .then((result) => {
    console.log(result);
  })
  .catch(err => {
    console.log(err);
  });
```

### REPLACE
Replaces a document using the doc id or insert. Similar to insert statement only changing INSERT for REPLACE.
```javascript
const document = {
  id: 1,
  content: 'this is the first post for the blog...',
  title: 'UPDATE! First post'
};

connection.getQueryBuilder()
  .replace('my_rtindex', document)
  .execute()
  .then((result) => {
    console.log(result);
  })
  .catch(err => {
    console.log(err);
  });
```

### UPDATE
```javascript
const document = {
  content: 'UPDATE! it\'s an old post. this is the first post for the blog...',
  title: 'First post (edit)'
};

connection.getQueryBuilder()
  .update('my_rtindex')
  .set(document)
  .match('fullname', 'John')
  .where('salary', '<', 3000)
  .execute()
  .then((result, fields) => {
    console.log(result);
  })
  .catch(err => {
    console.log(err);
  });
```


### Transactions
This package also comes with support for transactions. Remember that transactions are only
available for RT indexes. For more information visit [transactions documentation for Manticore search](https://docs.manticoresearch.com/latest/html/sphinxql_reference/begin,_commit,_and_rollback_syntax.html).

The transactions API is simple and the list of methods is below here:
- connection.getQueryBuilder().transaction.begin()
- connection.getQueryBuilder().transaction.start()  // same that begin()
- connection.getQueryBuilder().transaction.commit()
- connection.getQueryBuilder().transaction.rollback()

all this methods returns a promise object.

A simple example working with transactions:
```javascript
const document = {
  id: 1,
  content: 'this is the first post for the blog...',
  title: 'First post'
};

const insertDocumentAndCommit = async (doc) => {
  await connection.getQueryBuilder().transaction.begin();
  
  connection.getQueryBuilder()
    .insert('my_rtindex', doc)
    .execute()
    .then((result, fields) => {
      console.log(result);
    })
    .catch(err => {
      console.log(err);
    });

    await connection.getQueryBuilder().transaction.commit();

    return true;
}

insertDocumentAndCommit(document);
```

### More SphinxQL methods
- optimizeIndex(index: string): Promise<any>
- attachIndex(diskIndex: string): **AttachIndexStatement**
- truncate(rtIndex: string): **TruncateStatement**
- reloadIndex(index: string): **ReloadIndexStatement**

#### ATTACH INDEX (AttachIndexStatement)
Read about [ATTACH INDEX](https://docs.manticoresearch.com/latest/html/sphinxql_reference/attach_index_syntax.html) in Manticore documantation
To use this statement see example below:

```javascript
connection.getQueryBuilder()
  .attachIndex('my_disk_index')
  .to('my_rt_index')
  .withTruncate() // this method is optional
  .execute()
  .then((result, fields) => {
    console.log(result);
  })
  .catch(err => {
    console.log(err);
  });
```

#### TRUNCATE RTINDEX (TruncateStatement)
Read about [TRUNCATE RTINDEX](https://docs.manticoresearch.com/latest/html/sphinxql_reference/truncate_rtindex_syntax.html) in Manticore documantation
To use this statement see example below:

```javascript
connection.getQueryBuilder()
  .truncate('my_rt_index')
  .withReconfigure()  // this method is optional
  .execute()
  .then((result, fields) => {
    console.log(result);
  })
  .catch(err => {
    console.log(err);
  });
```

#### RELOAD INDEX
Read about [RELOAD INDEX](https://docs.manticoresearch.com/latest/html/sphinxql_reference/reload_index_syntax.html) in Manticore documantation
To use this statement see example below:

```javascript
connection.getQueryBuilder()
  .reloadIndex('my_index')
  .from('/home/mighty/new_index_files') // this method is optional
  .then((result, fields) => {
    console.log(result);
  })
  .catch(err => {
    console.log(err);
  });
```

### Run raw queries
//TODO


## Debug queries
All statements has a final method which is used internally to execute queries. This method is available
outside using generate() and returns a string with the final query.

```javascript
const sphinxqlQuery = connection.getQueryBuilder()
  .select('user_id', 'product_id', Expression.raw('SUM(product_price) as total').getExpression())
  .from('rt_sales')
  .facet((f) => {
    return f
      .fields(['category_id'])
      .by(['category_id'])
  })
  .facet((f) => {
    return f
      .field('brand_id')
      .orderBy(Expression.raw('facet()'))
      .limit(5)
  })
  .generate();

console.log(sphinxqlQuery); // SELECT user_id, product_id, SUM(product_price) as total FROM rt_sales FACET category_id BY category_id FACET brand_id ORDER BY facet() DESC LIMIT 5
```