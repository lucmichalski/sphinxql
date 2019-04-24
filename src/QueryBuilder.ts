import ClientInterface from './ClientInterface';
import SelectStatement from './Statements/SelectStatement';

export default class QueryBuilder {
  // protected type: QueryType;
  protected connection: ClientInterface;

  constructor(connection: ClientInterface) {
    this.connection = connection;
  }

  /**
   *
   * @param q
   * @param values
   */
  public query(q: string, values?: Array<any>) : Promise<any> {
    if (values !== undefined) {
      return this.connection.execute(q, values);
    }

    return this.connection.query(q);
  }

  public select(...fields: string[]): SelectStatement {
    return new SelectStatement(this.connection, ...fields);
  }
}