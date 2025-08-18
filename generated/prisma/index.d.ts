
/**
 * Client
**/

import * as runtime from './runtime/binary.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model User
 * 
 */
export type User = $Result.DefaultSelection<Prisma.$UserPayload>
/**
 * Model TeacherData
 * 
 */
export type TeacherData = $Result.DefaultSelection<Prisma.$TeacherDataPayload>
/**
 * Model StudentData
 * 
 */
export type StudentData = $Result.DefaultSelection<Prisma.$StudentDataPayload>
/**
 * Model CoachingData
 * 
 */
export type CoachingData = $Result.DefaultSelection<Prisma.$CoachingDataPayload>
/**
 * Model Question
 * 
 */
export type Question = $Result.DefaultSelection<Prisma.$QuestionPayload>
/**
 * Model Folder
 * 
 */
export type Folder = $Result.DefaultSelection<Prisma.$FolderPayload>
/**
 * Model FolderQuestion
 * 
 */
export type FolderQuestion = $Result.DefaultSelection<Prisma.$FolderQuestionPayload>
/**
 * Model TemplateForm
 * 
 */
export type TemplateForm = $Result.DefaultSelection<Prisma.$TemplateFormPayload>

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Users
 * const users = await prisma.user.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Users
   * const users = await prisma.user.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends (U | 'beforeExit')>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : V extends 'beforeExit' ? () => $Utils.JsPromise<void> : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

  /**
   * Add a middleware
   * @deprecated since 4.16.0. For new code, prefer client extensions instead.
   * @see https://pris.ly/d/extensions
   */
  $use(cb: Prisma.Middleware): void

/**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P]): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number }): $Utils.JsPromise<R>

  /**
   * Executes a raw MongoDB command and returns the result of it.
   * @example
   * ```
   * const user = await prisma.$runCommandRaw({
   *   aggregate: 'User',
   *   pipeline: [{ $match: { name: 'Bob' } }, { $project: { email: true, _id: false } }],
   *   explain: false,
   * })
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $runCommandRaw(command: Prisma.InputJsonObject): Prisma.PrismaPromise<Prisma.JsonObject>

  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.user`: Exposes CRUD operations for the **User** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Users
    * const users = await prisma.user.findMany()
    * ```
    */
  get user(): Prisma.UserDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.teacherData`: Exposes CRUD operations for the **TeacherData** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more TeacherData
    * const teacherData = await prisma.teacherData.findMany()
    * ```
    */
  get teacherData(): Prisma.TeacherDataDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.studentData`: Exposes CRUD operations for the **StudentData** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more StudentData
    * const studentData = await prisma.studentData.findMany()
    * ```
    */
  get studentData(): Prisma.StudentDataDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.coachingData`: Exposes CRUD operations for the **CoachingData** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more CoachingData
    * const coachingData = await prisma.coachingData.findMany()
    * ```
    */
  get coachingData(): Prisma.CoachingDataDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.question`: Exposes CRUD operations for the **Question** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Questions
    * const questions = await prisma.question.findMany()
    * ```
    */
  get question(): Prisma.QuestionDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.folder`: Exposes CRUD operations for the **Folder** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Folders
    * const folders = await prisma.folder.findMany()
    * ```
    */
  get folder(): Prisma.FolderDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.folderQuestion`: Exposes CRUD operations for the **FolderQuestion** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more FolderQuestions
    * const folderQuestions = await prisma.folderQuestion.findMany()
    * ```
    */
  get folderQuestion(): Prisma.FolderQuestionDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.templateForm`: Exposes CRUD operations for the **TemplateForm** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more TemplateForms
    * const templateForms = await prisma.templateForm.findMany()
    * ```
    */
  get templateForm(): Prisma.TemplateFormDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 6.11.1
   * Query Engine version: f40f79ec31188888a2e33acda0ecc8fd10a853a9
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    User: 'User',
    TeacherData: 'TeacherData',
    StudentData: 'StudentData',
    CoachingData: 'CoachingData',
    Question: 'Question',
    Folder: 'Folder',
    FolderQuestion: 'FolderQuestion',
    TemplateForm: 'TemplateForm'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "user" | "teacherData" | "studentData" | "coachingData" | "question" | "folder" | "folderQuestion" | "templateForm"
      txIsolationLevel: never
    }
    model: {
      User: {
        payload: Prisma.$UserPayload<ExtArgs>
        fields: Prisma.UserFieldRefs
        operations: {
          findUnique: {
            args: Prisma.UserFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.UserFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findFirst: {
            args: Prisma.UserFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.UserFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findMany: {
            args: Prisma.UserFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          create: {
            args: Prisma.UserCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          createMany: {
            args: Prisma.UserCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.UserDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          update: {
            args: Prisma.UserUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          deleteMany: {
            args: Prisma.UserDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.UserUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.UserUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          aggregate: {
            args: Prisma.UserAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateUser>
          }
          groupBy: {
            args: Prisma.UserGroupByArgs<ExtArgs>
            result: $Utils.Optional<UserGroupByOutputType>[]
          }
          findRaw: {
            args: Prisma.UserFindRawArgs<ExtArgs>
            result: JsonObject
          }
          aggregateRaw: {
            args: Prisma.UserAggregateRawArgs<ExtArgs>
            result: JsonObject
          }
          count: {
            args: Prisma.UserCountArgs<ExtArgs>
            result: $Utils.Optional<UserCountAggregateOutputType> | number
          }
        }
      }
      TeacherData: {
        payload: Prisma.$TeacherDataPayload<ExtArgs>
        fields: Prisma.TeacherDataFieldRefs
        operations: {
          findUnique: {
            args: Prisma.TeacherDataFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TeacherDataPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.TeacherDataFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TeacherDataPayload>
          }
          findFirst: {
            args: Prisma.TeacherDataFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TeacherDataPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.TeacherDataFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TeacherDataPayload>
          }
          findMany: {
            args: Prisma.TeacherDataFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TeacherDataPayload>[]
          }
          create: {
            args: Prisma.TeacherDataCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TeacherDataPayload>
          }
          createMany: {
            args: Prisma.TeacherDataCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.TeacherDataDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TeacherDataPayload>
          }
          update: {
            args: Prisma.TeacherDataUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TeacherDataPayload>
          }
          deleteMany: {
            args: Prisma.TeacherDataDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.TeacherDataUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.TeacherDataUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TeacherDataPayload>
          }
          aggregate: {
            args: Prisma.TeacherDataAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateTeacherData>
          }
          groupBy: {
            args: Prisma.TeacherDataGroupByArgs<ExtArgs>
            result: $Utils.Optional<TeacherDataGroupByOutputType>[]
          }
          findRaw: {
            args: Prisma.TeacherDataFindRawArgs<ExtArgs>
            result: JsonObject
          }
          aggregateRaw: {
            args: Prisma.TeacherDataAggregateRawArgs<ExtArgs>
            result: JsonObject
          }
          count: {
            args: Prisma.TeacherDataCountArgs<ExtArgs>
            result: $Utils.Optional<TeacherDataCountAggregateOutputType> | number
          }
        }
      }
      StudentData: {
        payload: Prisma.$StudentDataPayload<ExtArgs>
        fields: Prisma.StudentDataFieldRefs
        operations: {
          findUnique: {
            args: Prisma.StudentDataFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StudentDataPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.StudentDataFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StudentDataPayload>
          }
          findFirst: {
            args: Prisma.StudentDataFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StudentDataPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.StudentDataFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StudentDataPayload>
          }
          findMany: {
            args: Prisma.StudentDataFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StudentDataPayload>[]
          }
          create: {
            args: Prisma.StudentDataCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StudentDataPayload>
          }
          createMany: {
            args: Prisma.StudentDataCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.StudentDataDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StudentDataPayload>
          }
          update: {
            args: Prisma.StudentDataUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StudentDataPayload>
          }
          deleteMany: {
            args: Prisma.StudentDataDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.StudentDataUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.StudentDataUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StudentDataPayload>
          }
          aggregate: {
            args: Prisma.StudentDataAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateStudentData>
          }
          groupBy: {
            args: Prisma.StudentDataGroupByArgs<ExtArgs>
            result: $Utils.Optional<StudentDataGroupByOutputType>[]
          }
          findRaw: {
            args: Prisma.StudentDataFindRawArgs<ExtArgs>
            result: JsonObject
          }
          aggregateRaw: {
            args: Prisma.StudentDataAggregateRawArgs<ExtArgs>
            result: JsonObject
          }
          count: {
            args: Prisma.StudentDataCountArgs<ExtArgs>
            result: $Utils.Optional<StudentDataCountAggregateOutputType> | number
          }
        }
      }
      CoachingData: {
        payload: Prisma.$CoachingDataPayload<ExtArgs>
        fields: Prisma.CoachingDataFieldRefs
        operations: {
          findUnique: {
            args: Prisma.CoachingDataFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CoachingDataPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.CoachingDataFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CoachingDataPayload>
          }
          findFirst: {
            args: Prisma.CoachingDataFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CoachingDataPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.CoachingDataFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CoachingDataPayload>
          }
          findMany: {
            args: Prisma.CoachingDataFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CoachingDataPayload>[]
          }
          create: {
            args: Prisma.CoachingDataCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CoachingDataPayload>
          }
          createMany: {
            args: Prisma.CoachingDataCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.CoachingDataDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CoachingDataPayload>
          }
          update: {
            args: Prisma.CoachingDataUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CoachingDataPayload>
          }
          deleteMany: {
            args: Prisma.CoachingDataDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.CoachingDataUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.CoachingDataUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CoachingDataPayload>
          }
          aggregate: {
            args: Prisma.CoachingDataAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateCoachingData>
          }
          groupBy: {
            args: Prisma.CoachingDataGroupByArgs<ExtArgs>
            result: $Utils.Optional<CoachingDataGroupByOutputType>[]
          }
          findRaw: {
            args: Prisma.CoachingDataFindRawArgs<ExtArgs>
            result: JsonObject
          }
          aggregateRaw: {
            args: Prisma.CoachingDataAggregateRawArgs<ExtArgs>
            result: JsonObject
          }
          count: {
            args: Prisma.CoachingDataCountArgs<ExtArgs>
            result: $Utils.Optional<CoachingDataCountAggregateOutputType> | number
          }
        }
      }
      Question: {
        payload: Prisma.$QuestionPayload<ExtArgs>
        fields: Prisma.QuestionFieldRefs
        operations: {
          findUnique: {
            args: Prisma.QuestionFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuestionPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.QuestionFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuestionPayload>
          }
          findFirst: {
            args: Prisma.QuestionFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuestionPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.QuestionFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuestionPayload>
          }
          findMany: {
            args: Prisma.QuestionFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuestionPayload>[]
          }
          create: {
            args: Prisma.QuestionCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuestionPayload>
          }
          createMany: {
            args: Prisma.QuestionCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.QuestionDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuestionPayload>
          }
          update: {
            args: Prisma.QuestionUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuestionPayload>
          }
          deleteMany: {
            args: Prisma.QuestionDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.QuestionUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.QuestionUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuestionPayload>
          }
          aggregate: {
            args: Prisma.QuestionAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateQuestion>
          }
          groupBy: {
            args: Prisma.QuestionGroupByArgs<ExtArgs>
            result: $Utils.Optional<QuestionGroupByOutputType>[]
          }
          findRaw: {
            args: Prisma.QuestionFindRawArgs<ExtArgs>
            result: JsonObject
          }
          aggregateRaw: {
            args: Prisma.QuestionAggregateRawArgs<ExtArgs>
            result: JsonObject
          }
          count: {
            args: Prisma.QuestionCountArgs<ExtArgs>
            result: $Utils.Optional<QuestionCountAggregateOutputType> | number
          }
        }
      }
      Folder: {
        payload: Prisma.$FolderPayload<ExtArgs>
        fields: Prisma.FolderFieldRefs
        operations: {
          findUnique: {
            args: Prisma.FolderFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FolderPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.FolderFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FolderPayload>
          }
          findFirst: {
            args: Prisma.FolderFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FolderPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.FolderFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FolderPayload>
          }
          findMany: {
            args: Prisma.FolderFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FolderPayload>[]
          }
          create: {
            args: Prisma.FolderCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FolderPayload>
          }
          createMany: {
            args: Prisma.FolderCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.FolderDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FolderPayload>
          }
          update: {
            args: Prisma.FolderUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FolderPayload>
          }
          deleteMany: {
            args: Prisma.FolderDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.FolderUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.FolderUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FolderPayload>
          }
          aggregate: {
            args: Prisma.FolderAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateFolder>
          }
          groupBy: {
            args: Prisma.FolderGroupByArgs<ExtArgs>
            result: $Utils.Optional<FolderGroupByOutputType>[]
          }
          findRaw: {
            args: Prisma.FolderFindRawArgs<ExtArgs>
            result: JsonObject
          }
          aggregateRaw: {
            args: Prisma.FolderAggregateRawArgs<ExtArgs>
            result: JsonObject
          }
          count: {
            args: Prisma.FolderCountArgs<ExtArgs>
            result: $Utils.Optional<FolderCountAggregateOutputType> | number
          }
        }
      }
      FolderQuestion: {
        payload: Prisma.$FolderQuestionPayload<ExtArgs>
        fields: Prisma.FolderQuestionFieldRefs
        operations: {
          findUnique: {
            args: Prisma.FolderQuestionFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FolderQuestionPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.FolderQuestionFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FolderQuestionPayload>
          }
          findFirst: {
            args: Prisma.FolderQuestionFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FolderQuestionPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.FolderQuestionFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FolderQuestionPayload>
          }
          findMany: {
            args: Prisma.FolderQuestionFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FolderQuestionPayload>[]
          }
          create: {
            args: Prisma.FolderQuestionCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FolderQuestionPayload>
          }
          createMany: {
            args: Prisma.FolderQuestionCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.FolderQuestionDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FolderQuestionPayload>
          }
          update: {
            args: Prisma.FolderQuestionUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FolderQuestionPayload>
          }
          deleteMany: {
            args: Prisma.FolderQuestionDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.FolderQuestionUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.FolderQuestionUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FolderQuestionPayload>
          }
          aggregate: {
            args: Prisma.FolderQuestionAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateFolderQuestion>
          }
          groupBy: {
            args: Prisma.FolderQuestionGroupByArgs<ExtArgs>
            result: $Utils.Optional<FolderQuestionGroupByOutputType>[]
          }
          findRaw: {
            args: Prisma.FolderQuestionFindRawArgs<ExtArgs>
            result: JsonObject
          }
          aggregateRaw: {
            args: Prisma.FolderQuestionAggregateRawArgs<ExtArgs>
            result: JsonObject
          }
          count: {
            args: Prisma.FolderQuestionCountArgs<ExtArgs>
            result: $Utils.Optional<FolderQuestionCountAggregateOutputType> | number
          }
        }
      }
      TemplateForm: {
        payload: Prisma.$TemplateFormPayload<ExtArgs>
        fields: Prisma.TemplateFormFieldRefs
        operations: {
          findUnique: {
            args: Prisma.TemplateFormFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TemplateFormPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.TemplateFormFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TemplateFormPayload>
          }
          findFirst: {
            args: Prisma.TemplateFormFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TemplateFormPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.TemplateFormFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TemplateFormPayload>
          }
          findMany: {
            args: Prisma.TemplateFormFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TemplateFormPayload>[]
          }
          create: {
            args: Prisma.TemplateFormCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TemplateFormPayload>
          }
          createMany: {
            args: Prisma.TemplateFormCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.TemplateFormDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TemplateFormPayload>
          }
          update: {
            args: Prisma.TemplateFormUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TemplateFormPayload>
          }
          deleteMany: {
            args: Prisma.TemplateFormDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.TemplateFormUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.TemplateFormUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TemplateFormPayload>
          }
          aggregate: {
            args: Prisma.TemplateFormAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateTemplateForm>
          }
          groupBy: {
            args: Prisma.TemplateFormGroupByArgs<ExtArgs>
            result: $Utils.Optional<TemplateFormGroupByOutputType>[]
          }
          findRaw: {
            args: Prisma.TemplateFormFindRawArgs<ExtArgs>
            result: JsonObject
          }
          aggregateRaw: {
            args: Prisma.TemplateFormAggregateRawArgs<ExtArgs>
            result: JsonObject
          }
          count: {
            args: Prisma.TemplateFormCountArgs<ExtArgs>
            result: $Utils.Optional<TemplateFormCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $runCommandRaw: {
          args: Prisma.InputJsonObject,
          result: Prisma.JsonObject
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Defaults to stdout
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events
     * log: [
     *   { emit: 'stdout', level: 'query' },
     *   { emit: 'stdout', level: 'info' },
     *   { emit: 'stdout', level: 'warn' }
     *   { emit: 'stdout', level: 'error' }
     * ]
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
    }
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
  }
  export type GlobalOmitConfig = {
    user?: UserOmit
    teacherData?: TeacherDataOmit
    studentData?: StudentDataOmit
    coachingData?: CoachingDataOmit
    question?: QuestionOmit
    folder?: FolderOmit
    folderQuestion?: FolderQuestionOmit
    templateForm?: TemplateFormOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type GetLogType<T extends LogLevel | LogDefinition> = T extends LogDefinition ? T['emit'] extends 'event' ? T['level'] : never : never
  export type GetEvents<T extends any> = T extends Array<LogLevel | LogDefinition> ?
    GetLogType<T[0]> | GetLogType<T[1]> | GetLogType<T[2]> | GetLogType<T[3]>
    : never

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  /**
   * These options are being passed into the middleware as "params"
   */
  export type MiddlewareParams = {
    model?: ModelName
    action: PrismaAction
    args: any
    dataPath: string[]
    runInTransaction: boolean
  }

  /**
   * The `T` type makes sure, that the `return proceed` is not forgotten in the middleware implementation
   */
  export type Middleware<T = any> = (
    params: MiddlewareParams,
    next: (params: MiddlewareParams) => $Utils.JsPromise<T>,
  ) => $Utils.JsPromise<T>

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type UserCountOutputType
   */

  export type UserCountOutputType = {
    drafts: number
    templateForm: number
  }

  export type UserCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    drafts?: boolean | UserCountOutputTypeCountDraftsArgs
    templateForm?: boolean | UserCountOutputTypeCountTemplateFormArgs
  }

  // Custom InputTypes
  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserCountOutputType
     */
    select?: UserCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountDraftsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: FolderWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountTemplateFormArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TemplateFormWhereInput
  }


  /**
   * Count Type QuestionCountOutputType
   */

  export type QuestionCountOutputType = {
    folderRelations: number
  }

  export type QuestionCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    folderRelations?: boolean | QuestionCountOutputTypeCountFolderRelationsArgs
  }

  // Custom InputTypes
  /**
   * QuestionCountOutputType without action
   */
  export type QuestionCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuestionCountOutputType
     */
    select?: QuestionCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * QuestionCountOutputType without action
   */
  export type QuestionCountOutputTypeCountFolderRelationsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: FolderQuestionWhereInput
  }


  /**
   * Count Type FolderCountOutputType
   */

  export type FolderCountOutputType = {
    questionRelations: number
  }

  export type FolderCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    questionRelations?: boolean | FolderCountOutputTypeCountQuestionRelationsArgs
  }

  // Custom InputTypes
  /**
   * FolderCountOutputType without action
   */
  export type FolderCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FolderCountOutputType
     */
    select?: FolderCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * FolderCountOutputType without action
   */
  export type FolderCountOutputTypeCountQuestionRelationsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: FolderQuestionWhereInput
  }


  /**
   * Models
   */

  /**
   * Model User
   */

  export type AggregateUser = {
    _count: UserCountAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  export type UserMinAggregateOutputType = {
    id: string | null
    clerkUserId: string | null
    email: string | null
    name: string | null
    emailOtp: string | null
    phoneOtp: string | null
    otpExpiry: Date | null
    createdAt: Date | null
    updatedAt: Date | null
    profileImage: string | null
    role: string | null
  }

  export type UserMaxAggregateOutputType = {
    id: string | null
    clerkUserId: string | null
    email: string | null
    name: string | null
    emailOtp: string | null
    phoneOtp: string | null
    otpExpiry: Date | null
    createdAt: Date | null
    updatedAt: Date | null
    profileImage: string | null
    role: string | null
  }

  export type UserCountAggregateOutputType = {
    id: number
    clerkUserId: number
    email: number
    name: number
    emailOtp: number
    phoneOtp: number
    otpExpiry: number
    createdAt: number
    updatedAt: number
    profileImage: number
    role: number
    _all: number
  }


  export type UserMinAggregateInputType = {
    id?: true
    clerkUserId?: true
    email?: true
    name?: true
    emailOtp?: true
    phoneOtp?: true
    otpExpiry?: true
    createdAt?: true
    updatedAt?: true
    profileImage?: true
    role?: true
  }

  export type UserMaxAggregateInputType = {
    id?: true
    clerkUserId?: true
    email?: true
    name?: true
    emailOtp?: true
    phoneOtp?: true
    otpExpiry?: true
    createdAt?: true
    updatedAt?: true
    profileImage?: true
    role?: true
  }

  export type UserCountAggregateInputType = {
    id?: true
    clerkUserId?: true
    email?: true
    name?: true
    emailOtp?: true
    phoneOtp?: true
    otpExpiry?: true
    createdAt?: true
    updatedAt?: true
    profileImage?: true
    role?: true
    _all?: true
  }

  export type UserAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which User to aggregate.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Users
    **/
    _count?: true | UserCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: UserMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: UserMaxAggregateInputType
  }

  export type GetUserAggregateType<T extends UserAggregateArgs> = {
        [P in keyof T & keyof AggregateUser]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateUser[P]>
      : GetScalarType<T[P], AggregateUser[P]>
  }




  export type UserGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UserWhereInput
    orderBy?: UserOrderByWithAggregationInput | UserOrderByWithAggregationInput[]
    by: UserScalarFieldEnum[] | UserScalarFieldEnum
    having?: UserScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: UserCountAggregateInputType | true
    _min?: UserMinAggregateInputType
    _max?: UserMaxAggregateInputType
  }

  export type UserGroupByOutputType = {
    id: string
    clerkUserId: string
    email: string | null
    name: string | null
    emailOtp: string | null
    phoneOtp: string | null
    otpExpiry: Date | null
    createdAt: Date
    updatedAt: Date
    profileImage: string | null
    role: string
    _count: UserCountAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  type GetUserGroupByPayload<T extends UserGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<UserGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof UserGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], UserGroupByOutputType[P]>
            : GetScalarType<T[P], UserGroupByOutputType[P]>
        }
      >
    >


  export type UserSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    clerkUserId?: boolean
    email?: boolean
    name?: boolean
    emailOtp?: boolean
    phoneOtp?: boolean
    otpExpiry?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    profileImage?: boolean
    role?: boolean
    drafts?: boolean | User$draftsArgs<ExtArgs>
    teacherData?: boolean | User$teacherDataArgs<ExtArgs>
    studentData?: boolean | User$studentDataArgs<ExtArgs>
    coachingData?: boolean | User$coachingDataArgs<ExtArgs>
    templateForm?: boolean | User$templateFormArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["user"]>



  export type UserSelectScalar = {
    id?: boolean
    clerkUserId?: boolean
    email?: boolean
    name?: boolean
    emailOtp?: boolean
    phoneOtp?: boolean
    otpExpiry?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    profileImage?: boolean
    role?: boolean
  }

  export type UserOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "clerkUserId" | "email" | "name" | "emailOtp" | "phoneOtp" | "otpExpiry" | "createdAt" | "updatedAt" | "profileImage" | "role", ExtArgs["result"]["user"]>
  export type UserInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    drafts?: boolean | User$draftsArgs<ExtArgs>
    teacherData?: boolean | User$teacherDataArgs<ExtArgs>
    studentData?: boolean | User$studentDataArgs<ExtArgs>
    coachingData?: boolean | User$coachingDataArgs<ExtArgs>
    templateForm?: boolean | User$templateFormArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }

  export type $UserPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "User"
    objects: {
      drafts: Prisma.$FolderPayload<ExtArgs>[]
      teacherData: Prisma.$TeacherDataPayload<ExtArgs> | null
      studentData: Prisma.$StudentDataPayload<ExtArgs> | null
      coachingData: Prisma.$CoachingDataPayload<ExtArgs> | null
      templateForm: Prisma.$TemplateFormPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      clerkUserId: string
      email: string | null
      name: string | null
      emailOtp: string | null
      phoneOtp: string | null
      otpExpiry: Date | null
      createdAt: Date
      updatedAt: Date
      profileImage: string | null
      role: string
    }, ExtArgs["result"]["user"]>
    composites: {}
  }

  type UserGetPayload<S extends boolean | null | undefined | UserDefaultArgs> = $Result.GetResult<Prisma.$UserPayload, S>

  type UserCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<UserFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: UserCountAggregateInputType | true
    }

  export interface UserDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['User'], meta: { name: 'User' } }
    /**
     * Find zero or one User that matches the filter.
     * @param {UserFindUniqueArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends UserFindUniqueArgs>(args: SelectSubset<T, UserFindUniqueArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one User that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {UserFindUniqueOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends UserFindUniqueOrThrowArgs>(args: SelectSubset<T, UserFindUniqueOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first User that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends UserFindFirstArgs>(args?: SelectSubset<T, UserFindFirstArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first User that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends UserFindFirstOrThrowArgs>(args?: SelectSubset<T, UserFindFirstOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Users that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Users
     * const users = await prisma.user.findMany()
     * 
     * // Get first 10 Users
     * const users = await prisma.user.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const userWithIdOnly = await prisma.user.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends UserFindManyArgs>(args?: SelectSubset<T, UserFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a User.
     * @param {UserCreateArgs} args - Arguments to create a User.
     * @example
     * // Create one User
     * const User = await prisma.user.create({
     *   data: {
     *     // ... data to create a User
     *   }
     * })
     * 
     */
    create<T extends UserCreateArgs>(args: SelectSubset<T, UserCreateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Users.
     * @param {UserCreateManyArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends UserCreateManyArgs>(args?: SelectSubset<T, UserCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a User.
     * @param {UserDeleteArgs} args - Arguments to delete one User.
     * @example
     * // Delete one User
     * const User = await prisma.user.delete({
     *   where: {
     *     // ... filter to delete one User
     *   }
     * })
     * 
     */
    delete<T extends UserDeleteArgs>(args: SelectSubset<T, UserDeleteArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one User.
     * @param {UserUpdateArgs} args - Arguments to update one User.
     * @example
     * // Update one User
     * const user = await prisma.user.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends UserUpdateArgs>(args: SelectSubset<T, UserUpdateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Users.
     * @param {UserDeleteManyArgs} args - Arguments to filter Users to delete.
     * @example
     * // Delete a few Users
     * const { count } = await prisma.user.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends UserDeleteManyArgs>(args?: SelectSubset<T, UserDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends UserUpdateManyArgs>(args: SelectSubset<T, UserUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one User.
     * @param {UserUpsertArgs} args - Arguments to update or create a User.
     * @example
     * // Update or create a User
     * const user = await prisma.user.upsert({
     *   create: {
     *     // ... data to create a User
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the User we want to update
     *   }
     * })
     */
    upsert<T extends UserUpsertArgs>(args: SelectSubset<T, UserUpsertArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Users that matches the filter.
     * @param {UserFindRawArgs} args - Select which filters you would like to apply.
     * @example
     * const user = await prisma.user.findRaw({
     *   filter: { age: { $gt: 25 } }
     * })
     */
    findRaw(args?: UserFindRawArgs): Prisma.PrismaPromise<JsonObject>

    /**
     * Perform aggregation operations on a User.
     * @param {UserAggregateRawArgs} args - Select which aggregations you would like to apply.
     * @example
     * const user = await prisma.user.aggregateRaw({
     *   pipeline: [
     *     { $match: { status: "registered" } },
     *     { $group: { _id: "$country", total: { $sum: 1 } } }
     *   ]
     * })
     */
    aggregateRaw(args?: UserAggregateRawArgs): Prisma.PrismaPromise<JsonObject>


    /**
     * Count the number of Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserCountArgs} args - Arguments to filter Users to count.
     * @example
     * // Count the number of Users
     * const count = await prisma.user.count({
     *   where: {
     *     // ... the filter for the Users we want to count
     *   }
     * })
    **/
    count<T extends UserCountArgs>(
      args?: Subset<T, UserCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], UserCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends UserAggregateArgs>(args: Subset<T, UserAggregateArgs>): Prisma.PrismaPromise<GetUserAggregateType<T>>

    /**
     * Group by User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends UserGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: UserGroupByArgs['orderBy'] }
        : { orderBy?: UserGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, UserGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetUserGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the User model
   */
  readonly fields: UserFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for User.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__UserClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    drafts<T extends User$draftsArgs<ExtArgs> = {}>(args?: Subset<T, User$draftsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$FolderPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    teacherData<T extends User$teacherDataArgs<ExtArgs> = {}>(args?: Subset<T, User$teacherDataArgs<ExtArgs>>): Prisma__TeacherDataClient<$Result.GetResult<Prisma.$TeacherDataPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    studentData<T extends User$studentDataArgs<ExtArgs> = {}>(args?: Subset<T, User$studentDataArgs<ExtArgs>>): Prisma__StudentDataClient<$Result.GetResult<Prisma.$StudentDataPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    coachingData<T extends User$coachingDataArgs<ExtArgs> = {}>(args?: Subset<T, User$coachingDataArgs<ExtArgs>>): Prisma__CoachingDataClient<$Result.GetResult<Prisma.$CoachingDataPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    templateForm<T extends User$templateFormArgs<ExtArgs> = {}>(args?: Subset<T, User$templateFormArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TemplateFormPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the User model
   */
  interface UserFieldRefs {
    readonly id: FieldRef<"User", 'String'>
    readonly clerkUserId: FieldRef<"User", 'String'>
    readonly email: FieldRef<"User", 'String'>
    readonly name: FieldRef<"User", 'String'>
    readonly emailOtp: FieldRef<"User", 'String'>
    readonly phoneOtp: FieldRef<"User", 'String'>
    readonly otpExpiry: FieldRef<"User", 'DateTime'>
    readonly createdAt: FieldRef<"User", 'DateTime'>
    readonly updatedAt: FieldRef<"User", 'DateTime'>
    readonly profileImage: FieldRef<"User", 'String'>
    readonly role: FieldRef<"User", 'String'>
  }
    

  // Custom InputTypes
  /**
   * User findUnique
   */
  export type UserFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findUniqueOrThrow
   */
  export type UserFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findFirst
   */
  export type UserFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findFirstOrThrow
   */
  export type UserFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findMany
   */
  export type UserFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which Users to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User create
   */
  export type UserCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to create a User.
     */
    data: XOR<UserCreateInput, UserUncheckedCreateInput>
  }

  /**
   * User createMany
   */
  export type UserCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
  }

  /**
   * User update
   */
  export type UserUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to update a User.
     */
    data: XOR<UserUpdateInput, UserUncheckedUpdateInput>
    /**
     * Choose, which User to update.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User updateMany
   */
  export type UserUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to update.
     */
    limit?: number
  }

  /**
   * User upsert
   */
  export type UserUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The filter to search for the User to update in case it exists.
     */
    where: UserWhereUniqueInput
    /**
     * In case the User found by the `where` argument doesn't exist, create a new User with this data.
     */
    create: XOR<UserCreateInput, UserUncheckedCreateInput>
    /**
     * In case the User was found with the provided `where` argument, update it with this data.
     */
    update: XOR<UserUpdateInput, UserUncheckedUpdateInput>
  }

  /**
   * User delete
   */
  export type UserDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter which User to delete.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User deleteMany
   */
  export type UserDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Users to delete
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to delete.
     */
    limit?: number
  }

  /**
   * User findRaw
   */
  export type UserFindRawArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The query predicate filter. If unspecified, then all documents in the collection will match the predicate. ${@link https://docs.mongodb.com/manual/reference/operator/query MongoDB Docs}.
     */
    filter?: InputJsonValue
    /**
     * Additional options to pass to the `find` command ${@link https://docs.mongodb.com/manual/reference/command/find/#command-fields MongoDB Docs}.
     */
    options?: InputJsonValue
  }

  /**
   * User aggregateRaw
   */
  export type UserAggregateRawArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * An array of aggregation stages to process and transform the document stream via the aggregation pipeline. ${@link https://docs.mongodb.com/manual/reference/operator/aggregation-pipeline MongoDB Docs}.
     */
    pipeline?: InputJsonValue[]
    /**
     * Additional options to pass to the `aggregate` command ${@link https://docs.mongodb.com/manual/reference/command/aggregate/#command-fields MongoDB Docs}.
     */
    options?: InputJsonValue
  }

  /**
   * User.drafts
   */
  export type User$draftsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Folder
     */
    select?: FolderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Folder
     */
    omit?: FolderOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FolderInclude<ExtArgs> | null
    where?: FolderWhereInput
    orderBy?: FolderOrderByWithRelationInput | FolderOrderByWithRelationInput[]
    cursor?: FolderWhereUniqueInput
    take?: number
    skip?: number
    distinct?: FolderScalarFieldEnum | FolderScalarFieldEnum[]
  }

  /**
   * User.teacherData
   */
  export type User$teacherDataArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TeacherData
     */
    select?: TeacherDataSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TeacherData
     */
    omit?: TeacherDataOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TeacherDataInclude<ExtArgs> | null
    where?: TeacherDataWhereInput
  }

  /**
   * User.studentData
   */
  export type User$studentDataArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StudentData
     */
    select?: StudentDataSelect<ExtArgs> | null
    /**
     * Omit specific fields from the StudentData
     */
    omit?: StudentDataOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StudentDataInclude<ExtArgs> | null
    where?: StudentDataWhereInput
  }

  /**
   * User.coachingData
   */
  export type User$coachingDataArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CoachingData
     */
    select?: CoachingDataSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CoachingData
     */
    omit?: CoachingDataOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CoachingDataInclude<ExtArgs> | null
    where?: CoachingDataWhereInput
  }

  /**
   * User.templateForm
   */
  export type User$templateFormArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TemplateForm
     */
    select?: TemplateFormSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TemplateForm
     */
    omit?: TemplateFormOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TemplateFormInclude<ExtArgs> | null
    where?: TemplateFormWhereInput
    orderBy?: TemplateFormOrderByWithRelationInput | TemplateFormOrderByWithRelationInput[]
    cursor?: TemplateFormWhereUniqueInput
    take?: number
    skip?: number
    distinct?: TemplateFormScalarFieldEnum | TemplateFormScalarFieldEnum[]
  }

  /**
   * User without action
   */
  export type UserDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
  }


  /**
   * Model TeacherData
   */

  export type AggregateTeacherData = {
    _count: TeacherDataCountAggregateOutputType | null
    _min: TeacherDataMinAggregateOutputType | null
    _max: TeacherDataMaxAggregateOutputType | null
  }

  export type TeacherDataMinAggregateOutputType = {
    id: string | null
    userId: string | null
    name: string | null
    email: string | null
    school: string | null
    subject: string | null
    experience: string | null
    studentCount: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type TeacherDataMaxAggregateOutputType = {
    id: string | null
    userId: string | null
    name: string | null
    email: string | null
    school: string | null
    subject: string | null
    experience: string | null
    studentCount: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type TeacherDataCountAggregateOutputType = {
    id: number
    userId: number
    name: number
    email: number
    school: number
    subject: number
    experience: number
    studentCount: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type TeacherDataMinAggregateInputType = {
    id?: true
    userId?: true
    name?: true
    email?: true
    school?: true
    subject?: true
    experience?: true
    studentCount?: true
    createdAt?: true
    updatedAt?: true
  }

  export type TeacherDataMaxAggregateInputType = {
    id?: true
    userId?: true
    name?: true
    email?: true
    school?: true
    subject?: true
    experience?: true
    studentCount?: true
    createdAt?: true
    updatedAt?: true
  }

  export type TeacherDataCountAggregateInputType = {
    id?: true
    userId?: true
    name?: true
    email?: true
    school?: true
    subject?: true
    experience?: true
    studentCount?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type TeacherDataAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TeacherData to aggregate.
     */
    where?: TeacherDataWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TeacherData to fetch.
     */
    orderBy?: TeacherDataOrderByWithRelationInput | TeacherDataOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: TeacherDataWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TeacherData from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TeacherData.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned TeacherData
    **/
    _count?: true | TeacherDataCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: TeacherDataMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: TeacherDataMaxAggregateInputType
  }

  export type GetTeacherDataAggregateType<T extends TeacherDataAggregateArgs> = {
        [P in keyof T & keyof AggregateTeacherData]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTeacherData[P]>
      : GetScalarType<T[P], AggregateTeacherData[P]>
  }




  export type TeacherDataGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TeacherDataWhereInput
    orderBy?: TeacherDataOrderByWithAggregationInput | TeacherDataOrderByWithAggregationInput[]
    by: TeacherDataScalarFieldEnum[] | TeacherDataScalarFieldEnum
    having?: TeacherDataScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: TeacherDataCountAggregateInputType | true
    _min?: TeacherDataMinAggregateInputType
    _max?: TeacherDataMaxAggregateInputType
  }

  export type TeacherDataGroupByOutputType = {
    id: string
    userId: string
    name: string
    email: string
    school: string
    subject: string
    experience: string | null
    studentCount: string | null
    createdAt: Date
    updatedAt: Date
    _count: TeacherDataCountAggregateOutputType | null
    _min: TeacherDataMinAggregateOutputType | null
    _max: TeacherDataMaxAggregateOutputType | null
  }

  type GetTeacherDataGroupByPayload<T extends TeacherDataGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<TeacherDataGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof TeacherDataGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], TeacherDataGroupByOutputType[P]>
            : GetScalarType<T[P], TeacherDataGroupByOutputType[P]>
        }
      >
    >


  export type TeacherDataSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    name?: boolean
    email?: boolean
    school?: boolean
    subject?: boolean
    experience?: boolean
    studentCount?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["teacherData"]>



  export type TeacherDataSelectScalar = {
    id?: boolean
    userId?: boolean
    name?: boolean
    email?: boolean
    school?: boolean
    subject?: boolean
    experience?: boolean
    studentCount?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type TeacherDataOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "userId" | "name" | "email" | "school" | "subject" | "experience" | "studentCount" | "createdAt" | "updatedAt", ExtArgs["result"]["teacherData"]>
  export type TeacherDataInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $TeacherDataPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "TeacherData"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      userId: string
      name: string
      email: string
      school: string
      subject: string
      experience: string | null
      studentCount: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["teacherData"]>
    composites: {}
  }

  type TeacherDataGetPayload<S extends boolean | null | undefined | TeacherDataDefaultArgs> = $Result.GetResult<Prisma.$TeacherDataPayload, S>

  type TeacherDataCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<TeacherDataFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: TeacherDataCountAggregateInputType | true
    }

  export interface TeacherDataDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['TeacherData'], meta: { name: 'TeacherData' } }
    /**
     * Find zero or one TeacherData that matches the filter.
     * @param {TeacherDataFindUniqueArgs} args - Arguments to find a TeacherData
     * @example
     * // Get one TeacherData
     * const teacherData = await prisma.teacherData.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends TeacherDataFindUniqueArgs>(args: SelectSubset<T, TeacherDataFindUniqueArgs<ExtArgs>>): Prisma__TeacherDataClient<$Result.GetResult<Prisma.$TeacherDataPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one TeacherData that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {TeacherDataFindUniqueOrThrowArgs} args - Arguments to find a TeacherData
     * @example
     * // Get one TeacherData
     * const teacherData = await prisma.teacherData.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends TeacherDataFindUniqueOrThrowArgs>(args: SelectSubset<T, TeacherDataFindUniqueOrThrowArgs<ExtArgs>>): Prisma__TeacherDataClient<$Result.GetResult<Prisma.$TeacherDataPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first TeacherData that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TeacherDataFindFirstArgs} args - Arguments to find a TeacherData
     * @example
     * // Get one TeacherData
     * const teacherData = await prisma.teacherData.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends TeacherDataFindFirstArgs>(args?: SelectSubset<T, TeacherDataFindFirstArgs<ExtArgs>>): Prisma__TeacherDataClient<$Result.GetResult<Prisma.$TeacherDataPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first TeacherData that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TeacherDataFindFirstOrThrowArgs} args - Arguments to find a TeacherData
     * @example
     * // Get one TeacherData
     * const teacherData = await prisma.teacherData.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends TeacherDataFindFirstOrThrowArgs>(args?: SelectSubset<T, TeacherDataFindFirstOrThrowArgs<ExtArgs>>): Prisma__TeacherDataClient<$Result.GetResult<Prisma.$TeacherDataPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more TeacherData that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TeacherDataFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all TeacherData
     * const teacherData = await prisma.teacherData.findMany()
     * 
     * // Get first 10 TeacherData
     * const teacherData = await prisma.teacherData.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const teacherDataWithIdOnly = await prisma.teacherData.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends TeacherDataFindManyArgs>(args?: SelectSubset<T, TeacherDataFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TeacherDataPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a TeacherData.
     * @param {TeacherDataCreateArgs} args - Arguments to create a TeacherData.
     * @example
     * // Create one TeacherData
     * const TeacherData = await prisma.teacherData.create({
     *   data: {
     *     // ... data to create a TeacherData
     *   }
     * })
     * 
     */
    create<T extends TeacherDataCreateArgs>(args: SelectSubset<T, TeacherDataCreateArgs<ExtArgs>>): Prisma__TeacherDataClient<$Result.GetResult<Prisma.$TeacherDataPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many TeacherData.
     * @param {TeacherDataCreateManyArgs} args - Arguments to create many TeacherData.
     * @example
     * // Create many TeacherData
     * const teacherData = await prisma.teacherData.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends TeacherDataCreateManyArgs>(args?: SelectSubset<T, TeacherDataCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a TeacherData.
     * @param {TeacherDataDeleteArgs} args - Arguments to delete one TeacherData.
     * @example
     * // Delete one TeacherData
     * const TeacherData = await prisma.teacherData.delete({
     *   where: {
     *     // ... filter to delete one TeacherData
     *   }
     * })
     * 
     */
    delete<T extends TeacherDataDeleteArgs>(args: SelectSubset<T, TeacherDataDeleteArgs<ExtArgs>>): Prisma__TeacherDataClient<$Result.GetResult<Prisma.$TeacherDataPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one TeacherData.
     * @param {TeacherDataUpdateArgs} args - Arguments to update one TeacherData.
     * @example
     * // Update one TeacherData
     * const teacherData = await prisma.teacherData.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends TeacherDataUpdateArgs>(args: SelectSubset<T, TeacherDataUpdateArgs<ExtArgs>>): Prisma__TeacherDataClient<$Result.GetResult<Prisma.$TeacherDataPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more TeacherData.
     * @param {TeacherDataDeleteManyArgs} args - Arguments to filter TeacherData to delete.
     * @example
     * // Delete a few TeacherData
     * const { count } = await prisma.teacherData.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends TeacherDataDeleteManyArgs>(args?: SelectSubset<T, TeacherDataDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more TeacherData.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TeacherDataUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many TeacherData
     * const teacherData = await prisma.teacherData.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends TeacherDataUpdateManyArgs>(args: SelectSubset<T, TeacherDataUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one TeacherData.
     * @param {TeacherDataUpsertArgs} args - Arguments to update or create a TeacherData.
     * @example
     * // Update or create a TeacherData
     * const teacherData = await prisma.teacherData.upsert({
     *   create: {
     *     // ... data to create a TeacherData
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the TeacherData we want to update
     *   }
     * })
     */
    upsert<T extends TeacherDataUpsertArgs>(args: SelectSubset<T, TeacherDataUpsertArgs<ExtArgs>>): Prisma__TeacherDataClient<$Result.GetResult<Prisma.$TeacherDataPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more TeacherData that matches the filter.
     * @param {TeacherDataFindRawArgs} args - Select which filters you would like to apply.
     * @example
     * const teacherData = await prisma.teacherData.findRaw({
     *   filter: { age: { $gt: 25 } }
     * })
     */
    findRaw(args?: TeacherDataFindRawArgs): Prisma.PrismaPromise<JsonObject>

    /**
     * Perform aggregation operations on a TeacherData.
     * @param {TeacherDataAggregateRawArgs} args - Select which aggregations you would like to apply.
     * @example
     * const teacherData = await prisma.teacherData.aggregateRaw({
     *   pipeline: [
     *     { $match: { status: "registered" } },
     *     { $group: { _id: "$country", total: { $sum: 1 } } }
     *   ]
     * })
     */
    aggregateRaw(args?: TeacherDataAggregateRawArgs): Prisma.PrismaPromise<JsonObject>


    /**
     * Count the number of TeacherData.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TeacherDataCountArgs} args - Arguments to filter TeacherData to count.
     * @example
     * // Count the number of TeacherData
     * const count = await prisma.teacherData.count({
     *   where: {
     *     // ... the filter for the TeacherData we want to count
     *   }
     * })
    **/
    count<T extends TeacherDataCountArgs>(
      args?: Subset<T, TeacherDataCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], TeacherDataCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a TeacherData.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TeacherDataAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends TeacherDataAggregateArgs>(args: Subset<T, TeacherDataAggregateArgs>): Prisma.PrismaPromise<GetTeacherDataAggregateType<T>>

    /**
     * Group by TeacherData.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TeacherDataGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends TeacherDataGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: TeacherDataGroupByArgs['orderBy'] }
        : { orderBy?: TeacherDataGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, TeacherDataGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTeacherDataGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the TeacherData model
   */
  readonly fields: TeacherDataFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for TeacherData.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__TeacherDataClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the TeacherData model
   */
  interface TeacherDataFieldRefs {
    readonly id: FieldRef<"TeacherData", 'String'>
    readonly userId: FieldRef<"TeacherData", 'String'>
    readonly name: FieldRef<"TeacherData", 'String'>
    readonly email: FieldRef<"TeacherData", 'String'>
    readonly school: FieldRef<"TeacherData", 'String'>
    readonly subject: FieldRef<"TeacherData", 'String'>
    readonly experience: FieldRef<"TeacherData", 'String'>
    readonly studentCount: FieldRef<"TeacherData", 'String'>
    readonly createdAt: FieldRef<"TeacherData", 'DateTime'>
    readonly updatedAt: FieldRef<"TeacherData", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * TeacherData findUnique
   */
  export type TeacherDataFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TeacherData
     */
    select?: TeacherDataSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TeacherData
     */
    omit?: TeacherDataOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TeacherDataInclude<ExtArgs> | null
    /**
     * Filter, which TeacherData to fetch.
     */
    where: TeacherDataWhereUniqueInput
  }

  /**
   * TeacherData findUniqueOrThrow
   */
  export type TeacherDataFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TeacherData
     */
    select?: TeacherDataSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TeacherData
     */
    omit?: TeacherDataOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TeacherDataInclude<ExtArgs> | null
    /**
     * Filter, which TeacherData to fetch.
     */
    where: TeacherDataWhereUniqueInput
  }

  /**
   * TeacherData findFirst
   */
  export type TeacherDataFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TeacherData
     */
    select?: TeacherDataSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TeacherData
     */
    omit?: TeacherDataOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TeacherDataInclude<ExtArgs> | null
    /**
     * Filter, which TeacherData to fetch.
     */
    where?: TeacherDataWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TeacherData to fetch.
     */
    orderBy?: TeacherDataOrderByWithRelationInput | TeacherDataOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TeacherData.
     */
    cursor?: TeacherDataWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TeacherData from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TeacherData.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TeacherData.
     */
    distinct?: TeacherDataScalarFieldEnum | TeacherDataScalarFieldEnum[]
  }

  /**
   * TeacherData findFirstOrThrow
   */
  export type TeacherDataFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TeacherData
     */
    select?: TeacherDataSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TeacherData
     */
    omit?: TeacherDataOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TeacherDataInclude<ExtArgs> | null
    /**
     * Filter, which TeacherData to fetch.
     */
    where?: TeacherDataWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TeacherData to fetch.
     */
    orderBy?: TeacherDataOrderByWithRelationInput | TeacherDataOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TeacherData.
     */
    cursor?: TeacherDataWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TeacherData from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TeacherData.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TeacherData.
     */
    distinct?: TeacherDataScalarFieldEnum | TeacherDataScalarFieldEnum[]
  }

  /**
   * TeacherData findMany
   */
  export type TeacherDataFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TeacherData
     */
    select?: TeacherDataSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TeacherData
     */
    omit?: TeacherDataOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TeacherDataInclude<ExtArgs> | null
    /**
     * Filter, which TeacherData to fetch.
     */
    where?: TeacherDataWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TeacherData to fetch.
     */
    orderBy?: TeacherDataOrderByWithRelationInput | TeacherDataOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing TeacherData.
     */
    cursor?: TeacherDataWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TeacherData from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TeacherData.
     */
    skip?: number
    distinct?: TeacherDataScalarFieldEnum | TeacherDataScalarFieldEnum[]
  }

  /**
   * TeacherData create
   */
  export type TeacherDataCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TeacherData
     */
    select?: TeacherDataSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TeacherData
     */
    omit?: TeacherDataOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TeacherDataInclude<ExtArgs> | null
    /**
     * The data needed to create a TeacherData.
     */
    data: XOR<TeacherDataCreateInput, TeacherDataUncheckedCreateInput>
  }

  /**
   * TeacherData createMany
   */
  export type TeacherDataCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many TeacherData.
     */
    data: TeacherDataCreateManyInput | TeacherDataCreateManyInput[]
  }

  /**
   * TeacherData update
   */
  export type TeacherDataUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TeacherData
     */
    select?: TeacherDataSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TeacherData
     */
    omit?: TeacherDataOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TeacherDataInclude<ExtArgs> | null
    /**
     * The data needed to update a TeacherData.
     */
    data: XOR<TeacherDataUpdateInput, TeacherDataUncheckedUpdateInput>
    /**
     * Choose, which TeacherData to update.
     */
    where: TeacherDataWhereUniqueInput
  }

  /**
   * TeacherData updateMany
   */
  export type TeacherDataUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update TeacherData.
     */
    data: XOR<TeacherDataUpdateManyMutationInput, TeacherDataUncheckedUpdateManyInput>
    /**
     * Filter which TeacherData to update
     */
    where?: TeacherDataWhereInput
    /**
     * Limit how many TeacherData to update.
     */
    limit?: number
  }

  /**
   * TeacherData upsert
   */
  export type TeacherDataUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TeacherData
     */
    select?: TeacherDataSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TeacherData
     */
    omit?: TeacherDataOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TeacherDataInclude<ExtArgs> | null
    /**
     * The filter to search for the TeacherData to update in case it exists.
     */
    where: TeacherDataWhereUniqueInput
    /**
     * In case the TeacherData found by the `where` argument doesn't exist, create a new TeacherData with this data.
     */
    create: XOR<TeacherDataCreateInput, TeacherDataUncheckedCreateInput>
    /**
     * In case the TeacherData was found with the provided `where` argument, update it with this data.
     */
    update: XOR<TeacherDataUpdateInput, TeacherDataUncheckedUpdateInput>
  }

  /**
   * TeacherData delete
   */
  export type TeacherDataDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TeacherData
     */
    select?: TeacherDataSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TeacherData
     */
    omit?: TeacherDataOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TeacherDataInclude<ExtArgs> | null
    /**
     * Filter which TeacherData to delete.
     */
    where: TeacherDataWhereUniqueInput
  }

  /**
   * TeacherData deleteMany
   */
  export type TeacherDataDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TeacherData to delete
     */
    where?: TeacherDataWhereInput
    /**
     * Limit how many TeacherData to delete.
     */
    limit?: number
  }

  /**
   * TeacherData findRaw
   */
  export type TeacherDataFindRawArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The query predicate filter. If unspecified, then all documents in the collection will match the predicate. ${@link https://docs.mongodb.com/manual/reference/operator/query MongoDB Docs}.
     */
    filter?: InputJsonValue
    /**
     * Additional options to pass to the `find` command ${@link https://docs.mongodb.com/manual/reference/command/find/#command-fields MongoDB Docs}.
     */
    options?: InputJsonValue
  }

  /**
   * TeacherData aggregateRaw
   */
  export type TeacherDataAggregateRawArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * An array of aggregation stages to process and transform the document stream via the aggregation pipeline. ${@link https://docs.mongodb.com/manual/reference/operator/aggregation-pipeline MongoDB Docs}.
     */
    pipeline?: InputJsonValue[]
    /**
     * Additional options to pass to the `aggregate` command ${@link https://docs.mongodb.com/manual/reference/command/aggregate/#command-fields MongoDB Docs}.
     */
    options?: InputJsonValue
  }

  /**
   * TeacherData without action
   */
  export type TeacherDataDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TeacherData
     */
    select?: TeacherDataSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TeacherData
     */
    omit?: TeacherDataOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TeacherDataInclude<ExtArgs> | null
  }


  /**
   * Model StudentData
   */

  export type AggregateStudentData = {
    _count: StudentDataCountAggregateOutputType | null
    _min: StudentDataMinAggregateOutputType | null
    _max: StudentDataMaxAggregateOutputType | null
  }

  export type StudentDataMinAggregateOutputType = {
    id: string | null
    userId: string | null
    name: string | null
    email: string | null
    grade: string | null
    targetExam: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type StudentDataMaxAggregateOutputType = {
    id: string | null
    userId: string | null
    name: string | null
    email: string | null
    grade: string | null
    targetExam: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type StudentDataCountAggregateOutputType = {
    id: number
    userId: number
    name: number
    email: number
    grade: number
    targetExam: number
    subjects: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type StudentDataMinAggregateInputType = {
    id?: true
    userId?: true
    name?: true
    email?: true
    grade?: true
    targetExam?: true
    createdAt?: true
    updatedAt?: true
  }

  export type StudentDataMaxAggregateInputType = {
    id?: true
    userId?: true
    name?: true
    email?: true
    grade?: true
    targetExam?: true
    createdAt?: true
    updatedAt?: true
  }

  export type StudentDataCountAggregateInputType = {
    id?: true
    userId?: true
    name?: true
    email?: true
    grade?: true
    targetExam?: true
    subjects?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type StudentDataAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which StudentData to aggregate.
     */
    where?: StudentDataWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of StudentData to fetch.
     */
    orderBy?: StudentDataOrderByWithRelationInput | StudentDataOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: StudentDataWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` StudentData from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` StudentData.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned StudentData
    **/
    _count?: true | StudentDataCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: StudentDataMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: StudentDataMaxAggregateInputType
  }

  export type GetStudentDataAggregateType<T extends StudentDataAggregateArgs> = {
        [P in keyof T & keyof AggregateStudentData]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateStudentData[P]>
      : GetScalarType<T[P], AggregateStudentData[P]>
  }




  export type StudentDataGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: StudentDataWhereInput
    orderBy?: StudentDataOrderByWithAggregationInput | StudentDataOrderByWithAggregationInput[]
    by: StudentDataScalarFieldEnum[] | StudentDataScalarFieldEnum
    having?: StudentDataScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: StudentDataCountAggregateInputType | true
    _min?: StudentDataMinAggregateInputType
    _max?: StudentDataMaxAggregateInputType
  }

  export type StudentDataGroupByOutputType = {
    id: string
    userId: string
    name: string
    email: string
    grade: string
    targetExam: string
    subjects: string[]
    createdAt: Date
    updatedAt: Date
    _count: StudentDataCountAggregateOutputType | null
    _min: StudentDataMinAggregateOutputType | null
    _max: StudentDataMaxAggregateOutputType | null
  }

  type GetStudentDataGroupByPayload<T extends StudentDataGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<StudentDataGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof StudentDataGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], StudentDataGroupByOutputType[P]>
            : GetScalarType<T[P], StudentDataGroupByOutputType[P]>
        }
      >
    >


  export type StudentDataSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    name?: boolean
    email?: boolean
    grade?: boolean
    targetExam?: boolean
    subjects?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["studentData"]>



  export type StudentDataSelectScalar = {
    id?: boolean
    userId?: boolean
    name?: boolean
    email?: boolean
    grade?: boolean
    targetExam?: boolean
    subjects?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type StudentDataOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "userId" | "name" | "email" | "grade" | "targetExam" | "subjects" | "createdAt" | "updatedAt", ExtArgs["result"]["studentData"]>
  export type StudentDataInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $StudentDataPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "StudentData"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      userId: string
      name: string
      email: string
      grade: string
      targetExam: string
      subjects: string[]
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["studentData"]>
    composites: {}
  }

  type StudentDataGetPayload<S extends boolean | null | undefined | StudentDataDefaultArgs> = $Result.GetResult<Prisma.$StudentDataPayload, S>

  type StudentDataCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<StudentDataFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: StudentDataCountAggregateInputType | true
    }

  export interface StudentDataDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['StudentData'], meta: { name: 'StudentData' } }
    /**
     * Find zero or one StudentData that matches the filter.
     * @param {StudentDataFindUniqueArgs} args - Arguments to find a StudentData
     * @example
     * // Get one StudentData
     * const studentData = await prisma.studentData.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends StudentDataFindUniqueArgs>(args: SelectSubset<T, StudentDataFindUniqueArgs<ExtArgs>>): Prisma__StudentDataClient<$Result.GetResult<Prisma.$StudentDataPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one StudentData that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {StudentDataFindUniqueOrThrowArgs} args - Arguments to find a StudentData
     * @example
     * // Get one StudentData
     * const studentData = await prisma.studentData.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends StudentDataFindUniqueOrThrowArgs>(args: SelectSubset<T, StudentDataFindUniqueOrThrowArgs<ExtArgs>>): Prisma__StudentDataClient<$Result.GetResult<Prisma.$StudentDataPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first StudentData that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StudentDataFindFirstArgs} args - Arguments to find a StudentData
     * @example
     * // Get one StudentData
     * const studentData = await prisma.studentData.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends StudentDataFindFirstArgs>(args?: SelectSubset<T, StudentDataFindFirstArgs<ExtArgs>>): Prisma__StudentDataClient<$Result.GetResult<Prisma.$StudentDataPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first StudentData that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StudentDataFindFirstOrThrowArgs} args - Arguments to find a StudentData
     * @example
     * // Get one StudentData
     * const studentData = await prisma.studentData.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends StudentDataFindFirstOrThrowArgs>(args?: SelectSubset<T, StudentDataFindFirstOrThrowArgs<ExtArgs>>): Prisma__StudentDataClient<$Result.GetResult<Prisma.$StudentDataPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more StudentData that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StudentDataFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all StudentData
     * const studentData = await prisma.studentData.findMany()
     * 
     * // Get first 10 StudentData
     * const studentData = await prisma.studentData.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const studentDataWithIdOnly = await prisma.studentData.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends StudentDataFindManyArgs>(args?: SelectSubset<T, StudentDataFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$StudentDataPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a StudentData.
     * @param {StudentDataCreateArgs} args - Arguments to create a StudentData.
     * @example
     * // Create one StudentData
     * const StudentData = await prisma.studentData.create({
     *   data: {
     *     // ... data to create a StudentData
     *   }
     * })
     * 
     */
    create<T extends StudentDataCreateArgs>(args: SelectSubset<T, StudentDataCreateArgs<ExtArgs>>): Prisma__StudentDataClient<$Result.GetResult<Prisma.$StudentDataPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many StudentData.
     * @param {StudentDataCreateManyArgs} args - Arguments to create many StudentData.
     * @example
     * // Create many StudentData
     * const studentData = await prisma.studentData.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends StudentDataCreateManyArgs>(args?: SelectSubset<T, StudentDataCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a StudentData.
     * @param {StudentDataDeleteArgs} args - Arguments to delete one StudentData.
     * @example
     * // Delete one StudentData
     * const StudentData = await prisma.studentData.delete({
     *   where: {
     *     // ... filter to delete one StudentData
     *   }
     * })
     * 
     */
    delete<T extends StudentDataDeleteArgs>(args: SelectSubset<T, StudentDataDeleteArgs<ExtArgs>>): Prisma__StudentDataClient<$Result.GetResult<Prisma.$StudentDataPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one StudentData.
     * @param {StudentDataUpdateArgs} args - Arguments to update one StudentData.
     * @example
     * // Update one StudentData
     * const studentData = await prisma.studentData.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends StudentDataUpdateArgs>(args: SelectSubset<T, StudentDataUpdateArgs<ExtArgs>>): Prisma__StudentDataClient<$Result.GetResult<Prisma.$StudentDataPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more StudentData.
     * @param {StudentDataDeleteManyArgs} args - Arguments to filter StudentData to delete.
     * @example
     * // Delete a few StudentData
     * const { count } = await prisma.studentData.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends StudentDataDeleteManyArgs>(args?: SelectSubset<T, StudentDataDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more StudentData.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StudentDataUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many StudentData
     * const studentData = await prisma.studentData.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends StudentDataUpdateManyArgs>(args: SelectSubset<T, StudentDataUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one StudentData.
     * @param {StudentDataUpsertArgs} args - Arguments to update or create a StudentData.
     * @example
     * // Update or create a StudentData
     * const studentData = await prisma.studentData.upsert({
     *   create: {
     *     // ... data to create a StudentData
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the StudentData we want to update
     *   }
     * })
     */
    upsert<T extends StudentDataUpsertArgs>(args: SelectSubset<T, StudentDataUpsertArgs<ExtArgs>>): Prisma__StudentDataClient<$Result.GetResult<Prisma.$StudentDataPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more StudentData that matches the filter.
     * @param {StudentDataFindRawArgs} args - Select which filters you would like to apply.
     * @example
     * const studentData = await prisma.studentData.findRaw({
     *   filter: { age: { $gt: 25 } }
     * })
     */
    findRaw(args?: StudentDataFindRawArgs): Prisma.PrismaPromise<JsonObject>

    /**
     * Perform aggregation operations on a StudentData.
     * @param {StudentDataAggregateRawArgs} args - Select which aggregations you would like to apply.
     * @example
     * const studentData = await prisma.studentData.aggregateRaw({
     *   pipeline: [
     *     { $match: { status: "registered" } },
     *     { $group: { _id: "$country", total: { $sum: 1 } } }
     *   ]
     * })
     */
    aggregateRaw(args?: StudentDataAggregateRawArgs): Prisma.PrismaPromise<JsonObject>


    /**
     * Count the number of StudentData.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StudentDataCountArgs} args - Arguments to filter StudentData to count.
     * @example
     * // Count the number of StudentData
     * const count = await prisma.studentData.count({
     *   where: {
     *     // ... the filter for the StudentData we want to count
     *   }
     * })
    **/
    count<T extends StudentDataCountArgs>(
      args?: Subset<T, StudentDataCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], StudentDataCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a StudentData.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StudentDataAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends StudentDataAggregateArgs>(args: Subset<T, StudentDataAggregateArgs>): Prisma.PrismaPromise<GetStudentDataAggregateType<T>>

    /**
     * Group by StudentData.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StudentDataGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends StudentDataGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: StudentDataGroupByArgs['orderBy'] }
        : { orderBy?: StudentDataGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, StudentDataGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetStudentDataGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the StudentData model
   */
  readonly fields: StudentDataFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for StudentData.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__StudentDataClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the StudentData model
   */
  interface StudentDataFieldRefs {
    readonly id: FieldRef<"StudentData", 'String'>
    readonly userId: FieldRef<"StudentData", 'String'>
    readonly name: FieldRef<"StudentData", 'String'>
    readonly email: FieldRef<"StudentData", 'String'>
    readonly grade: FieldRef<"StudentData", 'String'>
    readonly targetExam: FieldRef<"StudentData", 'String'>
    readonly subjects: FieldRef<"StudentData", 'String[]'>
    readonly createdAt: FieldRef<"StudentData", 'DateTime'>
    readonly updatedAt: FieldRef<"StudentData", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * StudentData findUnique
   */
  export type StudentDataFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StudentData
     */
    select?: StudentDataSelect<ExtArgs> | null
    /**
     * Omit specific fields from the StudentData
     */
    omit?: StudentDataOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StudentDataInclude<ExtArgs> | null
    /**
     * Filter, which StudentData to fetch.
     */
    where: StudentDataWhereUniqueInput
  }

  /**
   * StudentData findUniqueOrThrow
   */
  export type StudentDataFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StudentData
     */
    select?: StudentDataSelect<ExtArgs> | null
    /**
     * Omit specific fields from the StudentData
     */
    omit?: StudentDataOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StudentDataInclude<ExtArgs> | null
    /**
     * Filter, which StudentData to fetch.
     */
    where: StudentDataWhereUniqueInput
  }

  /**
   * StudentData findFirst
   */
  export type StudentDataFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StudentData
     */
    select?: StudentDataSelect<ExtArgs> | null
    /**
     * Omit specific fields from the StudentData
     */
    omit?: StudentDataOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StudentDataInclude<ExtArgs> | null
    /**
     * Filter, which StudentData to fetch.
     */
    where?: StudentDataWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of StudentData to fetch.
     */
    orderBy?: StudentDataOrderByWithRelationInput | StudentDataOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for StudentData.
     */
    cursor?: StudentDataWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` StudentData from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` StudentData.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of StudentData.
     */
    distinct?: StudentDataScalarFieldEnum | StudentDataScalarFieldEnum[]
  }

  /**
   * StudentData findFirstOrThrow
   */
  export type StudentDataFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StudentData
     */
    select?: StudentDataSelect<ExtArgs> | null
    /**
     * Omit specific fields from the StudentData
     */
    omit?: StudentDataOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StudentDataInclude<ExtArgs> | null
    /**
     * Filter, which StudentData to fetch.
     */
    where?: StudentDataWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of StudentData to fetch.
     */
    orderBy?: StudentDataOrderByWithRelationInput | StudentDataOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for StudentData.
     */
    cursor?: StudentDataWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` StudentData from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` StudentData.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of StudentData.
     */
    distinct?: StudentDataScalarFieldEnum | StudentDataScalarFieldEnum[]
  }

  /**
   * StudentData findMany
   */
  export type StudentDataFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StudentData
     */
    select?: StudentDataSelect<ExtArgs> | null
    /**
     * Omit specific fields from the StudentData
     */
    omit?: StudentDataOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StudentDataInclude<ExtArgs> | null
    /**
     * Filter, which StudentData to fetch.
     */
    where?: StudentDataWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of StudentData to fetch.
     */
    orderBy?: StudentDataOrderByWithRelationInput | StudentDataOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing StudentData.
     */
    cursor?: StudentDataWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` StudentData from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` StudentData.
     */
    skip?: number
    distinct?: StudentDataScalarFieldEnum | StudentDataScalarFieldEnum[]
  }

  /**
   * StudentData create
   */
  export type StudentDataCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StudentData
     */
    select?: StudentDataSelect<ExtArgs> | null
    /**
     * Omit specific fields from the StudentData
     */
    omit?: StudentDataOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StudentDataInclude<ExtArgs> | null
    /**
     * The data needed to create a StudentData.
     */
    data: XOR<StudentDataCreateInput, StudentDataUncheckedCreateInput>
  }

  /**
   * StudentData createMany
   */
  export type StudentDataCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many StudentData.
     */
    data: StudentDataCreateManyInput | StudentDataCreateManyInput[]
  }

  /**
   * StudentData update
   */
  export type StudentDataUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StudentData
     */
    select?: StudentDataSelect<ExtArgs> | null
    /**
     * Omit specific fields from the StudentData
     */
    omit?: StudentDataOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StudentDataInclude<ExtArgs> | null
    /**
     * The data needed to update a StudentData.
     */
    data: XOR<StudentDataUpdateInput, StudentDataUncheckedUpdateInput>
    /**
     * Choose, which StudentData to update.
     */
    where: StudentDataWhereUniqueInput
  }

  /**
   * StudentData updateMany
   */
  export type StudentDataUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update StudentData.
     */
    data: XOR<StudentDataUpdateManyMutationInput, StudentDataUncheckedUpdateManyInput>
    /**
     * Filter which StudentData to update
     */
    where?: StudentDataWhereInput
    /**
     * Limit how many StudentData to update.
     */
    limit?: number
  }

  /**
   * StudentData upsert
   */
  export type StudentDataUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StudentData
     */
    select?: StudentDataSelect<ExtArgs> | null
    /**
     * Omit specific fields from the StudentData
     */
    omit?: StudentDataOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StudentDataInclude<ExtArgs> | null
    /**
     * The filter to search for the StudentData to update in case it exists.
     */
    where: StudentDataWhereUniqueInput
    /**
     * In case the StudentData found by the `where` argument doesn't exist, create a new StudentData with this data.
     */
    create: XOR<StudentDataCreateInput, StudentDataUncheckedCreateInput>
    /**
     * In case the StudentData was found with the provided `where` argument, update it with this data.
     */
    update: XOR<StudentDataUpdateInput, StudentDataUncheckedUpdateInput>
  }

  /**
   * StudentData delete
   */
  export type StudentDataDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StudentData
     */
    select?: StudentDataSelect<ExtArgs> | null
    /**
     * Omit specific fields from the StudentData
     */
    omit?: StudentDataOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StudentDataInclude<ExtArgs> | null
    /**
     * Filter which StudentData to delete.
     */
    where: StudentDataWhereUniqueInput
  }

  /**
   * StudentData deleteMany
   */
  export type StudentDataDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which StudentData to delete
     */
    where?: StudentDataWhereInput
    /**
     * Limit how many StudentData to delete.
     */
    limit?: number
  }

  /**
   * StudentData findRaw
   */
  export type StudentDataFindRawArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The query predicate filter. If unspecified, then all documents in the collection will match the predicate. ${@link https://docs.mongodb.com/manual/reference/operator/query MongoDB Docs}.
     */
    filter?: InputJsonValue
    /**
     * Additional options to pass to the `find` command ${@link https://docs.mongodb.com/manual/reference/command/find/#command-fields MongoDB Docs}.
     */
    options?: InputJsonValue
  }

  /**
   * StudentData aggregateRaw
   */
  export type StudentDataAggregateRawArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * An array of aggregation stages to process and transform the document stream via the aggregation pipeline. ${@link https://docs.mongodb.com/manual/reference/operator/aggregation-pipeline MongoDB Docs}.
     */
    pipeline?: InputJsonValue[]
    /**
     * Additional options to pass to the `aggregate` command ${@link https://docs.mongodb.com/manual/reference/command/aggregate/#command-fields MongoDB Docs}.
     */
    options?: InputJsonValue
  }

  /**
   * StudentData without action
   */
  export type StudentDataDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StudentData
     */
    select?: StudentDataSelect<ExtArgs> | null
    /**
     * Omit specific fields from the StudentData
     */
    omit?: StudentDataOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StudentDataInclude<ExtArgs> | null
  }


  /**
   * Model CoachingData
   */

  export type AggregateCoachingData = {
    _count: CoachingDataCountAggregateOutputType | null
    _min: CoachingDataMinAggregateOutputType | null
    _max: CoachingDataMaxAggregateOutputType | null
  }

  export type CoachingDataMinAggregateOutputType = {
    id: string | null
    userId: string | null
    centerName: string | null
    contactPerson: string | null
    email: string | null
    phone: string | null
    location: string | null
    teacherCount: string | null
    studentCount: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type CoachingDataMaxAggregateOutputType = {
    id: string | null
    userId: string | null
    centerName: string | null
    contactPerson: string | null
    email: string | null
    phone: string | null
    location: string | null
    teacherCount: string | null
    studentCount: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type CoachingDataCountAggregateOutputType = {
    id: number
    userId: number
    centerName: number
    contactPerson: number
    email: number
    phone: number
    location: number
    teacherCount: number
    studentCount: number
    targetExams: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type CoachingDataMinAggregateInputType = {
    id?: true
    userId?: true
    centerName?: true
    contactPerson?: true
    email?: true
    phone?: true
    location?: true
    teacherCount?: true
    studentCount?: true
    createdAt?: true
    updatedAt?: true
  }

  export type CoachingDataMaxAggregateInputType = {
    id?: true
    userId?: true
    centerName?: true
    contactPerson?: true
    email?: true
    phone?: true
    location?: true
    teacherCount?: true
    studentCount?: true
    createdAt?: true
    updatedAt?: true
  }

  export type CoachingDataCountAggregateInputType = {
    id?: true
    userId?: true
    centerName?: true
    contactPerson?: true
    email?: true
    phone?: true
    location?: true
    teacherCount?: true
    studentCount?: true
    targetExams?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type CoachingDataAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which CoachingData to aggregate.
     */
    where?: CoachingDataWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CoachingData to fetch.
     */
    orderBy?: CoachingDataOrderByWithRelationInput | CoachingDataOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: CoachingDataWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CoachingData from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CoachingData.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned CoachingData
    **/
    _count?: true | CoachingDataCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: CoachingDataMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: CoachingDataMaxAggregateInputType
  }

  export type GetCoachingDataAggregateType<T extends CoachingDataAggregateArgs> = {
        [P in keyof T & keyof AggregateCoachingData]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateCoachingData[P]>
      : GetScalarType<T[P], AggregateCoachingData[P]>
  }




  export type CoachingDataGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CoachingDataWhereInput
    orderBy?: CoachingDataOrderByWithAggregationInput | CoachingDataOrderByWithAggregationInput[]
    by: CoachingDataScalarFieldEnum[] | CoachingDataScalarFieldEnum
    having?: CoachingDataScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: CoachingDataCountAggregateInputType | true
    _min?: CoachingDataMinAggregateInputType
    _max?: CoachingDataMaxAggregateInputType
  }

  export type CoachingDataGroupByOutputType = {
    id: string
    userId: string
    centerName: string
    contactPerson: string
    email: string
    phone: string
    location: string
    teacherCount: string | null
    studentCount: string | null
    targetExams: string[]
    createdAt: Date
    updatedAt: Date
    _count: CoachingDataCountAggregateOutputType | null
    _min: CoachingDataMinAggregateOutputType | null
    _max: CoachingDataMaxAggregateOutputType | null
  }

  type GetCoachingDataGroupByPayload<T extends CoachingDataGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<CoachingDataGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof CoachingDataGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], CoachingDataGroupByOutputType[P]>
            : GetScalarType<T[P], CoachingDataGroupByOutputType[P]>
        }
      >
    >


  export type CoachingDataSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    centerName?: boolean
    contactPerson?: boolean
    email?: boolean
    phone?: boolean
    location?: boolean
    teacherCount?: boolean
    studentCount?: boolean
    targetExams?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["coachingData"]>



  export type CoachingDataSelectScalar = {
    id?: boolean
    userId?: boolean
    centerName?: boolean
    contactPerson?: boolean
    email?: boolean
    phone?: boolean
    location?: boolean
    teacherCount?: boolean
    studentCount?: boolean
    targetExams?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type CoachingDataOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "userId" | "centerName" | "contactPerson" | "email" | "phone" | "location" | "teacherCount" | "studentCount" | "targetExams" | "createdAt" | "updatedAt", ExtArgs["result"]["coachingData"]>
  export type CoachingDataInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $CoachingDataPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "CoachingData"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      userId: string
      centerName: string
      contactPerson: string
      email: string
      phone: string
      location: string
      teacherCount: string | null
      studentCount: string | null
      targetExams: string[]
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["coachingData"]>
    composites: {}
  }

  type CoachingDataGetPayload<S extends boolean | null | undefined | CoachingDataDefaultArgs> = $Result.GetResult<Prisma.$CoachingDataPayload, S>

  type CoachingDataCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<CoachingDataFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: CoachingDataCountAggregateInputType | true
    }

  export interface CoachingDataDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['CoachingData'], meta: { name: 'CoachingData' } }
    /**
     * Find zero or one CoachingData that matches the filter.
     * @param {CoachingDataFindUniqueArgs} args - Arguments to find a CoachingData
     * @example
     * // Get one CoachingData
     * const coachingData = await prisma.coachingData.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends CoachingDataFindUniqueArgs>(args: SelectSubset<T, CoachingDataFindUniqueArgs<ExtArgs>>): Prisma__CoachingDataClient<$Result.GetResult<Prisma.$CoachingDataPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one CoachingData that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {CoachingDataFindUniqueOrThrowArgs} args - Arguments to find a CoachingData
     * @example
     * // Get one CoachingData
     * const coachingData = await prisma.coachingData.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends CoachingDataFindUniqueOrThrowArgs>(args: SelectSubset<T, CoachingDataFindUniqueOrThrowArgs<ExtArgs>>): Prisma__CoachingDataClient<$Result.GetResult<Prisma.$CoachingDataPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first CoachingData that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CoachingDataFindFirstArgs} args - Arguments to find a CoachingData
     * @example
     * // Get one CoachingData
     * const coachingData = await prisma.coachingData.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends CoachingDataFindFirstArgs>(args?: SelectSubset<T, CoachingDataFindFirstArgs<ExtArgs>>): Prisma__CoachingDataClient<$Result.GetResult<Prisma.$CoachingDataPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first CoachingData that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CoachingDataFindFirstOrThrowArgs} args - Arguments to find a CoachingData
     * @example
     * // Get one CoachingData
     * const coachingData = await prisma.coachingData.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends CoachingDataFindFirstOrThrowArgs>(args?: SelectSubset<T, CoachingDataFindFirstOrThrowArgs<ExtArgs>>): Prisma__CoachingDataClient<$Result.GetResult<Prisma.$CoachingDataPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more CoachingData that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CoachingDataFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all CoachingData
     * const coachingData = await prisma.coachingData.findMany()
     * 
     * // Get first 10 CoachingData
     * const coachingData = await prisma.coachingData.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const coachingDataWithIdOnly = await prisma.coachingData.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends CoachingDataFindManyArgs>(args?: SelectSubset<T, CoachingDataFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CoachingDataPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a CoachingData.
     * @param {CoachingDataCreateArgs} args - Arguments to create a CoachingData.
     * @example
     * // Create one CoachingData
     * const CoachingData = await prisma.coachingData.create({
     *   data: {
     *     // ... data to create a CoachingData
     *   }
     * })
     * 
     */
    create<T extends CoachingDataCreateArgs>(args: SelectSubset<T, CoachingDataCreateArgs<ExtArgs>>): Prisma__CoachingDataClient<$Result.GetResult<Prisma.$CoachingDataPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many CoachingData.
     * @param {CoachingDataCreateManyArgs} args - Arguments to create many CoachingData.
     * @example
     * // Create many CoachingData
     * const coachingData = await prisma.coachingData.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends CoachingDataCreateManyArgs>(args?: SelectSubset<T, CoachingDataCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a CoachingData.
     * @param {CoachingDataDeleteArgs} args - Arguments to delete one CoachingData.
     * @example
     * // Delete one CoachingData
     * const CoachingData = await prisma.coachingData.delete({
     *   where: {
     *     // ... filter to delete one CoachingData
     *   }
     * })
     * 
     */
    delete<T extends CoachingDataDeleteArgs>(args: SelectSubset<T, CoachingDataDeleteArgs<ExtArgs>>): Prisma__CoachingDataClient<$Result.GetResult<Prisma.$CoachingDataPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one CoachingData.
     * @param {CoachingDataUpdateArgs} args - Arguments to update one CoachingData.
     * @example
     * // Update one CoachingData
     * const coachingData = await prisma.coachingData.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends CoachingDataUpdateArgs>(args: SelectSubset<T, CoachingDataUpdateArgs<ExtArgs>>): Prisma__CoachingDataClient<$Result.GetResult<Prisma.$CoachingDataPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more CoachingData.
     * @param {CoachingDataDeleteManyArgs} args - Arguments to filter CoachingData to delete.
     * @example
     * // Delete a few CoachingData
     * const { count } = await prisma.coachingData.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends CoachingDataDeleteManyArgs>(args?: SelectSubset<T, CoachingDataDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more CoachingData.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CoachingDataUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many CoachingData
     * const coachingData = await prisma.coachingData.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends CoachingDataUpdateManyArgs>(args: SelectSubset<T, CoachingDataUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one CoachingData.
     * @param {CoachingDataUpsertArgs} args - Arguments to update or create a CoachingData.
     * @example
     * // Update or create a CoachingData
     * const coachingData = await prisma.coachingData.upsert({
     *   create: {
     *     // ... data to create a CoachingData
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the CoachingData we want to update
     *   }
     * })
     */
    upsert<T extends CoachingDataUpsertArgs>(args: SelectSubset<T, CoachingDataUpsertArgs<ExtArgs>>): Prisma__CoachingDataClient<$Result.GetResult<Prisma.$CoachingDataPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more CoachingData that matches the filter.
     * @param {CoachingDataFindRawArgs} args - Select which filters you would like to apply.
     * @example
     * const coachingData = await prisma.coachingData.findRaw({
     *   filter: { age: { $gt: 25 } }
     * })
     */
    findRaw(args?: CoachingDataFindRawArgs): Prisma.PrismaPromise<JsonObject>

    /**
     * Perform aggregation operations on a CoachingData.
     * @param {CoachingDataAggregateRawArgs} args - Select which aggregations you would like to apply.
     * @example
     * const coachingData = await prisma.coachingData.aggregateRaw({
     *   pipeline: [
     *     { $match: { status: "registered" } },
     *     { $group: { _id: "$country", total: { $sum: 1 } } }
     *   ]
     * })
     */
    aggregateRaw(args?: CoachingDataAggregateRawArgs): Prisma.PrismaPromise<JsonObject>


    /**
     * Count the number of CoachingData.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CoachingDataCountArgs} args - Arguments to filter CoachingData to count.
     * @example
     * // Count the number of CoachingData
     * const count = await prisma.coachingData.count({
     *   where: {
     *     // ... the filter for the CoachingData we want to count
     *   }
     * })
    **/
    count<T extends CoachingDataCountArgs>(
      args?: Subset<T, CoachingDataCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], CoachingDataCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a CoachingData.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CoachingDataAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends CoachingDataAggregateArgs>(args: Subset<T, CoachingDataAggregateArgs>): Prisma.PrismaPromise<GetCoachingDataAggregateType<T>>

    /**
     * Group by CoachingData.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CoachingDataGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends CoachingDataGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: CoachingDataGroupByArgs['orderBy'] }
        : { orderBy?: CoachingDataGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, CoachingDataGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetCoachingDataGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the CoachingData model
   */
  readonly fields: CoachingDataFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for CoachingData.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__CoachingDataClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the CoachingData model
   */
  interface CoachingDataFieldRefs {
    readonly id: FieldRef<"CoachingData", 'String'>
    readonly userId: FieldRef<"CoachingData", 'String'>
    readonly centerName: FieldRef<"CoachingData", 'String'>
    readonly contactPerson: FieldRef<"CoachingData", 'String'>
    readonly email: FieldRef<"CoachingData", 'String'>
    readonly phone: FieldRef<"CoachingData", 'String'>
    readonly location: FieldRef<"CoachingData", 'String'>
    readonly teacherCount: FieldRef<"CoachingData", 'String'>
    readonly studentCount: FieldRef<"CoachingData", 'String'>
    readonly targetExams: FieldRef<"CoachingData", 'String[]'>
    readonly createdAt: FieldRef<"CoachingData", 'DateTime'>
    readonly updatedAt: FieldRef<"CoachingData", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * CoachingData findUnique
   */
  export type CoachingDataFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CoachingData
     */
    select?: CoachingDataSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CoachingData
     */
    omit?: CoachingDataOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CoachingDataInclude<ExtArgs> | null
    /**
     * Filter, which CoachingData to fetch.
     */
    where: CoachingDataWhereUniqueInput
  }

  /**
   * CoachingData findUniqueOrThrow
   */
  export type CoachingDataFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CoachingData
     */
    select?: CoachingDataSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CoachingData
     */
    omit?: CoachingDataOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CoachingDataInclude<ExtArgs> | null
    /**
     * Filter, which CoachingData to fetch.
     */
    where: CoachingDataWhereUniqueInput
  }

  /**
   * CoachingData findFirst
   */
  export type CoachingDataFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CoachingData
     */
    select?: CoachingDataSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CoachingData
     */
    omit?: CoachingDataOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CoachingDataInclude<ExtArgs> | null
    /**
     * Filter, which CoachingData to fetch.
     */
    where?: CoachingDataWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CoachingData to fetch.
     */
    orderBy?: CoachingDataOrderByWithRelationInput | CoachingDataOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for CoachingData.
     */
    cursor?: CoachingDataWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CoachingData from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CoachingData.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of CoachingData.
     */
    distinct?: CoachingDataScalarFieldEnum | CoachingDataScalarFieldEnum[]
  }

  /**
   * CoachingData findFirstOrThrow
   */
  export type CoachingDataFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CoachingData
     */
    select?: CoachingDataSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CoachingData
     */
    omit?: CoachingDataOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CoachingDataInclude<ExtArgs> | null
    /**
     * Filter, which CoachingData to fetch.
     */
    where?: CoachingDataWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CoachingData to fetch.
     */
    orderBy?: CoachingDataOrderByWithRelationInput | CoachingDataOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for CoachingData.
     */
    cursor?: CoachingDataWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CoachingData from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CoachingData.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of CoachingData.
     */
    distinct?: CoachingDataScalarFieldEnum | CoachingDataScalarFieldEnum[]
  }

  /**
   * CoachingData findMany
   */
  export type CoachingDataFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CoachingData
     */
    select?: CoachingDataSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CoachingData
     */
    omit?: CoachingDataOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CoachingDataInclude<ExtArgs> | null
    /**
     * Filter, which CoachingData to fetch.
     */
    where?: CoachingDataWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CoachingData to fetch.
     */
    orderBy?: CoachingDataOrderByWithRelationInput | CoachingDataOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing CoachingData.
     */
    cursor?: CoachingDataWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CoachingData from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CoachingData.
     */
    skip?: number
    distinct?: CoachingDataScalarFieldEnum | CoachingDataScalarFieldEnum[]
  }

  /**
   * CoachingData create
   */
  export type CoachingDataCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CoachingData
     */
    select?: CoachingDataSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CoachingData
     */
    omit?: CoachingDataOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CoachingDataInclude<ExtArgs> | null
    /**
     * The data needed to create a CoachingData.
     */
    data: XOR<CoachingDataCreateInput, CoachingDataUncheckedCreateInput>
  }

  /**
   * CoachingData createMany
   */
  export type CoachingDataCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many CoachingData.
     */
    data: CoachingDataCreateManyInput | CoachingDataCreateManyInput[]
  }

  /**
   * CoachingData update
   */
  export type CoachingDataUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CoachingData
     */
    select?: CoachingDataSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CoachingData
     */
    omit?: CoachingDataOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CoachingDataInclude<ExtArgs> | null
    /**
     * The data needed to update a CoachingData.
     */
    data: XOR<CoachingDataUpdateInput, CoachingDataUncheckedUpdateInput>
    /**
     * Choose, which CoachingData to update.
     */
    where: CoachingDataWhereUniqueInput
  }

  /**
   * CoachingData updateMany
   */
  export type CoachingDataUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update CoachingData.
     */
    data: XOR<CoachingDataUpdateManyMutationInput, CoachingDataUncheckedUpdateManyInput>
    /**
     * Filter which CoachingData to update
     */
    where?: CoachingDataWhereInput
    /**
     * Limit how many CoachingData to update.
     */
    limit?: number
  }

  /**
   * CoachingData upsert
   */
  export type CoachingDataUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CoachingData
     */
    select?: CoachingDataSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CoachingData
     */
    omit?: CoachingDataOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CoachingDataInclude<ExtArgs> | null
    /**
     * The filter to search for the CoachingData to update in case it exists.
     */
    where: CoachingDataWhereUniqueInput
    /**
     * In case the CoachingData found by the `where` argument doesn't exist, create a new CoachingData with this data.
     */
    create: XOR<CoachingDataCreateInput, CoachingDataUncheckedCreateInput>
    /**
     * In case the CoachingData was found with the provided `where` argument, update it with this data.
     */
    update: XOR<CoachingDataUpdateInput, CoachingDataUncheckedUpdateInput>
  }

  /**
   * CoachingData delete
   */
  export type CoachingDataDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CoachingData
     */
    select?: CoachingDataSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CoachingData
     */
    omit?: CoachingDataOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CoachingDataInclude<ExtArgs> | null
    /**
     * Filter which CoachingData to delete.
     */
    where: CoachingDataWhereUniqueInput
  }

  /**
   * CoachingData deleteMany
   */
  export type CoachingDataDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which CoachingData to delete
     */
    where?: CoachingDataWhereInput
    /**
     * Limit how many CoachingData to delete.
     */
    limit?: number
  }

  /**
   * CoachingData findRaw
   */
  export type CoachingDataFindRawArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The query predicate filter. If unspecified, then all documents in the collection will match the predicate. ${@link https://docs.mongodb.com/manual/reference/operator/query MongoDB Docs}.
     */
    filter?: InputJsonValue
    /**
     * Additional options to pass to the `find` command ${@link https://docs.mongodb.com/manual/reference/command/find/#command-fields MongoDB Docs}.
     */
    options?: InputJsonValue
  }

  /**
   * CoachingData aggregateRaw
   */
  export type CoachingDataAggregateRawArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * An array of aggregation stages to process and transform the document stream via the aggregation pipeline. ${@link https://docs.mongodb.com/manual/reference/operator/aggregation-pipeline MongoDB Docs}.
     */
    pipeline?: InputJsonValue[]
    /**
     * Additional options to pass to the `aggregate` command ${@link https://docs.mongodb.com/manual/reference/command/aggregate/#command-fields MongoDB Docs}.
     */
    options?: InputJsonValue
  }

  /**
   * CoachingData without action
   */
  export type CoachingDataDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CoachingData
     */
    select?: CoachingDataSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CoachingData
     */
    omit?: CoachingDataOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CoachingDataInclude<ExtArgs> | null
  }


  /**
   * Model Question
   */

  export type AggregateQuestion = {
    _count: QuestionCountAggregateOutputType | null
    _avg: QuestionAvgAggregateOutputType | null
    _sum: QuestionSumAggregateOutputType | null
    _min: QuestionMinAggregateOutputType | null
    _max: QuestionMaxAggregateOutputType | null
  }

  export type QuestionAvgAggregateOutputType = {
    question_number: number | null
  }

  export type QuestionSumAggregateOutputType = {
    question_number: number | null
  }

  export type QuestionMinAggregateOutputType = {
    id: string | null
    question_number: number | null
    file_name: string | null
    question_text: string | null
    isQuestionImage: boolean | null
    question_image: string | null
    isOptionImage: boolean | null
    section_name: string | null
    question_type: string | null
    topic: string | null
    exam_name: string | null
    subject: string | null
    chapter: string | null
    answer: string | null
    flagged: boolean | null
  }

  export type QuestionMaxAggregateOutputType = {
    id: string | null
    question_number: number | null
    file_name: string | null
    question_text: string | null
    isQuestionImage: boolean | null
    question_image: string | null
    isOptionImage: boolean | null
    section_name: string | null
    question_type: string | null
    topic: string | null
    exam_name: string | null
    subject: string | null
    chapter: string | null
    answer: string | null
    flagged: boolean | null
  }

  export type QuestionCountAggregateOutputType = {
    id: number
    question_number: number
    file_name: number
    question_text: number
    isQuestionImage: number
    question_image: number
    isOptionImage: number
    options: number
    option_images: number
    section_name: number
    question_type: number
    topic: number
    exam_name: number
    subject: number
    chapter: number
    answer: number
    flagged: number
    _all: number
  }


  export type QuestionAvgAggregateInputType = {
    question_number?: true
  }

  export type QuestionSumAggregateInputType = {
    question_number?: true
  }

  export type QuestionMinAggregateInputType = {
    id?: true
    question_number?: true
    file_name?: true
    question_text?: true
    isQuestionImage?: true
    question_image?: true
    isOptionImage?: true
    section_name?: true
    question_type?: true
    topic?: true
    exam_name?: true
    subject?: true
    chapter?: true
    answer?: true
    flagged?: true
  }

  export type QuestionMaxAggregateInputType = {
    id?: true
    question_number?: true
    file_name?: true
    question_text?: true
    isQuestionImage?: true
    question_image?: true
    isOptionImage?: true
    section_name?: true
    question_type?: true
    topic?: true
    exam_name?: true
    subject?: true
    chapter?: true
    answer?: true
    flagged?: true
  }

  export type QuestionCountAggregateInputType = {
    id?: true
    question_number?: true
    file_name?: true
    question_text?: true
    isQuestionImage?: true
    question_image?: true
    isOptionImage?: true
    options?: true
    option_images?: true
    section_name?: true
    question_type?: true
    topic?: true
    exam_name?: true
    subject?: true
    chapter?: true
    answer?: true
    flagged?: true
    _all?: true
  }

  export type QuestionAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Question to aggregate.
     */
    where?: QuestionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Questions to fetch.
     */
    orderBy?: QuestionOrderByWithRelationInput | QuestionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: QuestionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Questions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Questions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Questions
    **/
    _count?: true | QuestionCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: QuestionAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: QuestionSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: QuestionMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: QuestionMaxAggregateInputType
  }

  export type GetQuestionAggregateType<T extends QuestionAggregateArgs> = {
        [P in keyof T & keyof AggregateQuestion]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateQuestion[P]>
      : GetScalarType<T[P], AggregateQuestion[P]>
  }




  export type QuestionGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: QuestionWhereInput
    orderBy?: QuestionOrderByWithAggregationInput | QuestionOrderByWithAggregationInput[]
    by: QuestionScalarFieldEnum[] | QuestionScalarFieldEnum
    having?: QuestionScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: QuestionCountAggregateInputType | true
    _avg?: QuestionAvgAggregateInputType
    _sum?: QuestionSumAggregateInputType
    _min?: QuestionMinAggregateInputType
    _max?: QuestionMaxAggregateInputType
  }

  export type QuestionGroupByOutputType = {
    id: string
    question_number: number
    file_name: string | null
    question_text: string
    isQuestionImage: boolean
    question_image: string | null
    isOptionImage: boolean
    options: string[]
    option_images: string[]
    section_name: string | null
    question_type: string | null
    topic: string | null
    exam_name: string | null
    subject: string | null
    chapter: string | null
    answer: string | null
    flagged: boolean | null
    _count: QuestionCountAggregateOutputType | null
    _avg: QuestionAvgAggregateOutputType | null
    _sum: QuestionSumAggregateOutputType | null
    _min: QuestionMinAggregateOutputType | null
    _max: QuestionMaxAggregateOutputType | null
  }

  type GetQuestionGroupByPayload<T extends QuestionGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<QuestionGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof QuestionGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], QuestionGroupByOutputType[P]>
            : GetScalarType<T[P], QuestionGroupByOutputType[P]>
        }
      >
    >


  export type QuestionSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    question_number?: boolean
    file_name?: boolean
    question_text?: boolean
    isQuestionImage?: boolean
    question_image?: boolean
    isOptionImage?: boolean
    options?: boolean
    option_images?: boolean
    section_name?: boolean
    question_type?: boolean
    topic?: boolean
    exam_name?: boolean
    subject?: boolean
    chapter?: boolean
    answer?: boolean
    flagged?: boolean
    folderRelations?: boolean | Question$folderRelationsArgs<ExtArgs>
    _count?: boolean | QuestionCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["question"]>



  export type QuestionSelectScalar = {
    id?: boolean
    question_number?: boolean
    file_name?: boolean
    question_text?: boolean
    isQuestionImage?: boolean
    question_image?: boolean
    isOptionImage?: boolean
    options?: boolean
    option_images?: boolean
    section_name?: boolean
    question_type?: boolean
    topic?: boolean
    exam_name?: boolean
    subject?: boolean
    chapter?: boolean
    answer?: boolean
    flagged?: boolean
  }

  export type QuestionOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "question_number" | "file_name" | "question_text" | "isQuestionImage" | "question_image" | "isOptionImage" | "options" | "option_images" | "section_name" | "question_type" | "topic" | "exam_name" | "subject" | "chapter" | "answer" | "flagged", ExtArgs["result"]["question"]>
  export type QuestionInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    folderRelations?: boolean | Question$folderRelationsArgs<ExtArgs>
    _count?: boolean | QuestionCountOutputTypeDefaultArgs<ExtArgs>
  }

  export type $QuestionPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Question"
    objects: {
      folderRelations: Prisma.$FolderQuestionPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      question_number: number
      file_name: string | null
      question_text: string
      isQuestionImage: boolean
      question_image: string | null
      isOptionImage: boolean
      options: string[]
      option_images: string[]
      section_name: string | null
      question_type: string | null
      topic: string | null
      exam_name: string | null
      subject: string | null
      chapter: string | null
      answer: string | null
      flagged: boolean | null
    }, ExtArgs["result"]["question"]>
    composites: {}
  }

  type QuestionGetPayload<S extends boolean | null | undefined | QuestionDefaultArgs> = $Result.GetResult<Prisma.$QuestionPayload, S>

  type QuestionCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<QuestionFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: QuestionCountAggregateInputType | true
    }

  export interface QuestionDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Question'], meta: { name: 'Question' } }
    /**
     * Find zero or one Question that matches the filter.
     * @param {QuestionFindUniqueArgs} args - Arguments to find a Question
     * @example
     * // Get one Question
     * const question = await prisma.question.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends QuestionFindUniqueArgs>(args: SelectSubset<T, QuestionFindUniqueArgs<ExtArgs>>): Prisma__QuestionClient<$Result.GetResult<Prisma.$QuestionPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Question that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {QuestionFindUniqueOrThrowArgs} args - Arguments to find a Question
     * @example
     * // Get one Question
     * const question = await prisma.question.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends QuestionFindUniqueOrThrowArgs>(args: SelectSubset<T, QuestionFindUniqueOrThrowArgs<ExtArgs>>): Prisma__QuestionClient<$Result.GetResult<Prisma.$QuestionPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Question that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuestionFindFirstArgs} args - Arguments to find a Question
     * @example
     * // Get one Question
     * const question = await prisma.question.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends QuestionFindFirstArgs>(args?: SelectSubset<T, QuestionFindFirstArgs<ExtArgs>>): Prisma__QuestionClient<$Result.GetResult<Prisma.$QuestionPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Question that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuestionFindFirstOrThrowArgs} args - Arguments to find a Question
     * @example
     * // Get one Question
     * const question = await prisma.question.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends QuestionFindFirstOrThrowArgs>(args?: SelectSubset<T, QuestionFindFirstOrThrowArgs<ExtArgs>>): Prisma__QuestionClient<$Result.GetResult<Prisma.$QuestionPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Questions that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuestionFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Questions
     * const questions = await prisma.question.findMany()
     * 
     * // Get first 10 Questions
     * const questions = await prisma.question.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const questionWithIdOnly = await prisma.question.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends QuestionFindManyArgs>(args?: SelectSubset<T, QuestionFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$QuestionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Question.
     * @param {QuestionCreateArgs} args - Arguments to create a Question.
     * @example
     * // Create one Question
     * const Question = await prisma.question.create({
     *   data: {
     *     // ... data to create a Question
     *   }
     * })
     * 
     */
    create<T extends QuestionCreateArgs>(args: SelectSubset<T, QuestionCreateArgs<ExtArgs>>): Prisma__QuestionClient<$Result.GetResult<Prisma.$QuestionPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Questions.
     * @param {QuestionCreateManyArgs} args - Arguments to create many Questions.
     * @example
     * // Create many Questions
     * const question = await prisma.question.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends QuestionCreateManyArgs>(args?: SelectSubset<T, QuestionCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a Question.
     * @param {QuestionDeleteArgs} args - Arguments to delete one Question.
     * @example
     * // Delete one Question
     * const Question = await prisma.question.delete({
     *   where: {
     *     // ... filter to delete one Question
     *   }
     * })
     * 
     */
    delete<T extends QuestionDeleteArgs>(args: SelectSubset<T, QuestionDeleteArgs<ExtArgs>>): Prisma__QuestionClient<$Result.GetResult<Prisma.$QuestionPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Question.
     * @param {QuestionUpdateArgs} args - Arguments to update one Question.
     * @example
     * // Update one Question
     * const question = await prisma.question.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends QuestionUpdateArgs>(args: SelectSubset<T, QuestionUpdateArgs<ExtArgs>>): Prisma__QuestionClient<$Result.GetResult<Prisma.$QuestionPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Questions.
     * @param {QuestionDeleteManyArgs} args - Arguments to filter Questions to delete.
     * @example
     * // Delete a few Questions
     * const { count } = await prisma.question.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends QuestionDeleteManyArgs>(args?: SelectSubset<T, QuestionDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Questions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuestionUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Questions
     * const question = await prisma.question.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends QuestionUpdateManyArgs>(args: SelectSubset<T, QuestionUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Question.
     * @param {QuestionUpsertArgs} args - Arguments to update or create a Question.
     * @example
     * // Update or create a Question
     * const question = await prisma.question.upsert({
     *   create: {
     *     // ... data to create a Question
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Question we want to update
     *   }
     * })
     */
    upsert<T extends QuestionUpsertArgs>(args: SelectSubset<T, QuestionUpsertArgs<ExtArgs>>): Prisma__QuestionClient<$Result.GetResult<Prisma.$QuestionPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Questions that matches the filter.
     * @param {QuestionFindRawArgs} args - Select which filters you would like to apply.
     * @example
     * const question = await prisma.question.findRaw({
     *   filter: { age: { $gt: 25 } }
     * })
     */
    findRaw(args?: QuestionFindRawArgs): Prisma.PrismaPromise<JsonObject>

    /**
     * Perform aggregation operations on a Question.
     * @param {QuestionAggregateRawArgs} args - Select which aggregations you would like to apply.
     * @example
     * const question = await prisma.question.aggregateRaw({
     *   pipeline: [
     *     { $match: { status: "registered" } },
     *     { $group: { _id: "$country", total: { $sum: 1 } } }
     *   ]
     * })
     */
    aggregateRaw(args?: QuestionAggregateRawArgs): Prisma.PrismaPromise<JsonObject>


    /**
     * Count the number of Questions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuestionCountArgs} args - Arguments to filter Questions to count.
     * @example
     * // Count the number of Questions
     * const count = await prisma.question.count({
     *   where: {
     *     // ... the filter for the Questions we want to count
     *   }
     * })
    **/
    count<T extends QuestionCountArgs>(
      args?: Subset<T, QuestionCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], QuestionCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Question.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuestionAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends QuestionAggregateArgs>(args: Subset<T, QuestionAggregateArgs>): Prisma.PrismaPromise<GetQuestionAggregateType<T>>

    /**
     * Group by Question.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuestionGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends QuestionGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: QuestionGroupByArgs['orderBy'] }
        : { orderBy?: QuestionGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, QuestionGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetQuestionGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Question model
   */
  readonly fields: QuestionFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Question.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__QuestionClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    folderRelations<T extends Question$folderRelationsArgs<ExtArgs> = {}>(args?: Subset<T, Question$folderRelationsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$FolderQuestionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Question model
   */
  interface QuestionFieldRefs {
    readonly id: FieldRef<"Question", 'String'>
    readonly question_number: FieldRef<"Question", 'Int'>
    readonly file_name: FieldRef<"Question", 'String'>
    readonly question_text: FieldRef<"Question", 'String'>
    readonly isQuestionImage: FieldRef<"Question", 'Boolean'>
    readonly question_image: FieldRef<"Question", 'String'>
    readonly isOptionImage: FieldRef<"Question", 'Boolean'>
    readonly options: FieldRef<"Question", 'String[]'>
    readonly option_images: FieldRef<"Question", 'String[]'>
    readonly section_name: FieldRef<"Question", 'String'>
    readonly question_type: FieldRef<"Question", 'String'>
    readonly topic: FieldRef<"Question", 'String'>
    readonly exam_name: FieldRef<"Question", 'String'>
    readonly subject: FieldRef<"Question", 'String'>
    readonly chapter: FieldRef<"Question", 'String'>
    readonly answer: FieldRef<"Question", 'String'>
    readonly flagged: FieldRef<"Question", 'Boolean'>
  }
    

  // Custom InputTypes
  /**
   * Question findUnique
   */
  export type QuestionFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Question
     */
    select?: QuestionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Question
     */
    omit?: QuestionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuestionInclude<ExtArgs> | null
    /**
     * Filter, which Question to fetch.
     */
    where: QuestionWhereUniqueInput
  }

  /**
   * Question findUniqueOrThrow
   */
  export type QuestionFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Question
     */
    select?: QuestionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Question
     */
    omit?: QuestionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuestionInclude<ExtArgs> | null
    /**
     * Filter, which Question to fetch.
     */
    where: QuestionWhereUniqueInput
  }

  /**
   * Question findFirst
   */
  export type QuestionFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Question
     */
    select?: QuestionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Question
     */
    omit?: QuestionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuestionInclude<ExtArgs> | null
    /**
     * Filter, which Question to fetch.
     */
    where?: QuestionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Questions to fetch.
     */
    orderBy?: QuestionOrderByWithRelationInput | QuestionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Questions.
     */
    cursor?: QuestionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Questions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Questions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Questions.
     */
    distinct?: QuestionScalarFieldEnum | QuestionScalarFieldEnum[]
  }

  /**
   * Question findFirstOrThrow
   */
  export type QuestionFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Question
     */
    select?: QuestionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Question
     */
    omit?: QuestionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuestionInclude<ExtArgs> | null
    /**
     * Filter, which Question to fetch.
     */
    where?: QuestionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Questions to fetch.
     */
    orderBy?: QuestionOrderByWithRelationInput | QuestionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Questions.
     */
    cursor?: QuestionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Questions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Questions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Questions.
     */
    distinct?: QuestionScalarFieldEnum | QuestionScalarFieldEnum[]
  }

  /**
   * Question findMany
   */
  export type QuestionFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Question
     */
    select?: QuestionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Question
     */
    omit?: QuestionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuestionInclude<ExtArgs> | null
    /**
     * Filter, which Questions to fetch.
     */
    where?: QuestionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Questions to fetch.
     */
    orderBy?: QuestionOrderByWithRelationInput | QuestionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Questions.
     */
    cursor?: QuestionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Questions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Questions.
     */
    skip?: number
    distinct?: QuestionScalarFieldEnum | QuestionScalarFieldEnum[]
  }

  /**
   * Question create
   */
  export type QuestionCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Question
     */
    select?: QuestionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Question
     */
    omit?: QuestionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuestionInclude<ExtArgs> | null
    /**
     * The data needed to create a Question.
     */
    data: XOR<QuestionCreateInput, QuestionUncheckedCreateInput>
  }

  /**
   * Question createMany
   */
  export type QuestionCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Questions.
     */
    data: QuestionCreateManyInput | QuestionCreateManyInput[]
  }

  /**
   * Question update
   */
  export type QuestionUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Question
     */
    select?: QuestionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Question
     */
    omit?: QuestionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuestionInclude<ExtArgs> | null
    /**
     * The data needed to update a Question.
     */
    data: XOR<QuestionUpdateInput, QuestionUncheckedUpdateInput>
    /**
     * Choose, which Question to update.
     */
    where: QuestionWhereUniqueInput
  }

  /**
   * Question updateMany
   */
  export type QuestionUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Questions.
     */
    data: XOR<QuestionUpdateManyMutationInput, QuestionUncheckedUpdateManyInput>
    /**
     * Filter which Questions to update
     */
    where?: QuestionWhereInput
    /**
     * Limit how many Questions to update.
     */
    limit?: number
  }

  /**
   * Question upsert
   */
  export type QuestionUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Question
     */
    select?: QuestionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Question
     */
    omit?: QuestionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuestionInclude<ExtArgs> | null
    /**
     * The filter to search for the Question to update in case it exists.
     */
    where: QuestionWhereUniqueInput
    /**
     * In case the Question found by the `where` argument doesn't exist, create a new Question with this data.
     */
    create: XOR<QuestionCreateInput, QuestionUncheckedCreateInput>
    /**
     * In case the Question was found with the provided `where` argument, update it with this data.
     */
    update: XOR<QuestionUpdateInput, QuestionUncheckedUpdateInput>
  }

  /**
   * Question delete
   */
  export type QuestionDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Question
     */
    select?: QuestionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Question
     */
    omit?: QuestionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuestionInclude<ExtArgs> | null
    /**
     * Filter which Question to delete.
     */
    where: QuestionWhereUniqueInput
  }

  /**
   * Question deleteMany
   */
  export type QuestionDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Questions to delete
     */
    where?: QuestionWhereInput
    /**
     * Limit how many Questions to delete.
     */
    limit?: number
  }

  /**
   * Question findRaw
   */
  export type QuestionFindRawArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The query predicate filter. If unspecified, then all documents in the collection will match the predicate. ${@link https://docs.mongodb.com/manual/reference/operator/query MongoDB Docs}.
     */
    filter?: InputJsonValue
    /**
     * Additional options to pass to the `find` command ${@link https://docs.mongodb.com/manual/reference/command/find/#command-fields MongoDB Docs}.
     */
    options?: InputJsonValue
  }

  /**
   * Question aggregateRaw
   */
  export type QuestionAggregateRawArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * An array of aggregation stages to process and transform the document stream via the aggregation pipeline. ${@link https://docs.mongodb.com/manual/reference/operator/aggregation-pipeline MongoDB Docs}.
     */
    pipeline?: InputJsonValue[]
    /**
     * Additional options to pass to the `aggregate` command ${@link https://docs.mongodb.com/manual/reference/command/aggregate/#command-fields MongoDB Docs}.
     */
    options?: InputJsonValue
  }

  /**
   * Question.folderRelations
   */
  export type Question$folderRelationsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FolderQuestion
     */
    select?: FolderQuestionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the FolderQuestion
     */
    omit?: FolderQuestionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FolderQuestionInclude<ExtArgs> | null
    where?: FolderQuestionWhereInput
    orderBy?: FolderQuestionOrderByWithRelationInput | FolderQuestionOrderByWithRelationInput[]
    cursor?: FolderQuestionWhereUniqueInput
    take?: number
    skip?: number
    distinct?: FolderQuestionScalarFieldEnum | FolderQuestionScalarFieldEnum[]
  }

  /**
   * Question without action
   */
  export type QuestionDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Question
     */
    select?: QuestionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Question
     */
    omit?: QuestionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuestionInclude<ExtArgs> | null
  }


  /**
   * Model Folder
   */

  export type AggregateFolder = {
    _count: FolderCountAggregateOutputType | null
    _min: FolderMinAggregateOutputType | null
    _max: FolderMaxAggregateOutputType | null
  }

  export type FolderMinAggregateOutputType = {
    id: string | null
    name: string | null
    userId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type FolderMaxAggregateOutputType = {
    id: string | null
    name: string | null
    userId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type FolderCountAggregateOutputType = {
    id: number
    name: number
    userId: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type FolderMinAggregateInputType = {
    id?: true
    name?: true
    userId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type FolderMaxAggregateInputType = {
    id?: true
    name?: true
    userId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type FolderCountAggregateInputType = {
    id?: true
    name?: true
    userId?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type FolderAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Folder to aggregate.
     */
    where?: FolderWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Folders to fetch.
     */
    orderBy?: FolderOrderByWithRelationInput | FolderOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: FolderWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Folders from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Folders.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Folders
    **/
    _count?: true | FolderCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: FolderMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: FolderMaxAggregateInputType
  }

  export type GetFolderAggregateType<T extends FolderAggregateArgs> = {
        [P in keyof T & keyof AggregateFolder]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateFolder[P]>
      : GetScalarType<T[P], AggregateFolder[P]>
  }




  export type FolderGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: FolderWhereInput
    orderBy?: FolderOrderByWithAggregationInput | FolderOrderByWithAggregationInput[]
    by: FolderScalarFieldEnum[] | FolderScalarFieldEnum
    having?: FolderScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: FolderCountAggregateInputType | true
    _min?: FolderMinAggregateInputType
    _max?: FolderMaxAggregateInputType
  }

  export type FolderGroupByOutputType = {
    id: string
    name: string
    userId: string
    createdAt: Date
    updatedAt: Date
    _count: FolderCountAggregateOutputType | null
    _min: FolderMinAggregateOutputType | null
    _max: FolderMaxAggregateOutputType | null
  }

  type GetFolderGroupByPayload<T extends FolderGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<FolderGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof FolderGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], FolderGroupByOutputType[P]>
            : GetScalarType<T[P], FolderGroupByOutputType[P]>
        }
      >
    >


  export type FolderSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    userId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
    questionRelations?: boolean | Folder$questionRelationsArgs<ExtArgs>
    _count?: boolean | FolderCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["folder"]>



  export type FolderSelectScalar = {
    id?: boolean
    name?: boolean
    userId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type FolderOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "name" | "userId" | "createdAt" | "updatedAt", ExtArgs["result"]["folder"]>
  export type FolderInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
    questionRelations?: boolean | Folder$questionRelationsArgs<ExtArgs>
    _count?: boolean | FolderCountOutputTypeDefaultArgs<ExtArgs>
  }

  export type $FolderPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Folder"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
      questionRelations: Prisma.$FolderQuestionPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string
      userId: string
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["folder"]>
    composites: {}
  }

  type FolderGetPayload<S extends boolean | null | undefined | FolderDefaultArgs> = $Result.GetResult<Prisma.$FolderPayload, S>

  type FolderCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<FolderFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: FolderCountAggregateInputType | true
    }

  export interface FolderDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Folder'], meta: { name: 'Folder' } }
    /**
     * Find zero or one Folder that matches the filter.
     * @param {FolderFindUniqueArgs} args - Arguments to find a Folder
     * @example
     * // Get one Folder
     * const folder = await prisma.folder.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends FolderFindUniqueArgs>(args: SelectSubset<T, FolderFindUniqueArgs<ExtArgs>>): Prisma__FolderClient<$Result.GetResult<Prisma.$FolderPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Folder that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {FolderFindUniqueOrThrowArgs} args - Arguments to find a Folder
     * @example
     * // Get one Folder
     * const folder = await prisma.folder.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends FolderFindUniqueOrThrowArgs>(args: SelectSubset<T, FolderFindUniqueOrThrowArgs<ExtArgs>>): Prisma__FolderClient<$Result.GetResult<Prisma.$FolderPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Folder that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FolderFindFirstArgs} args - Arguments to find a Folder
     * @example
     * // Get one Folder
     * const folder = await prisma.folder.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends FolderFindFirstArgs>(args?: SelectSubset<T, FolderFindFirstArgs<ExtArgs>>): Prisma__FolderClient<$Result.GetResult<Prisma.$FolderPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Folder that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FolderFindFirstOrThrowArgs} args - Arguments to find a Folder
     * @example
     * // Get one Folder
     * const folder = await prisma.folder.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends FolderFindFirstOrThrowArgs>(args?: SelectSubset<T, FolderFindFirstOrThrowArgs<ExtArgs>>): Prisma__FolderClient<$Result.GetResult<Prisma.$FolderPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Folders that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FolderFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Folders
     * const folders = await prisma.folder.findMany()
     * 
     * // Get first 10 Folders
     * const folders = await prisma.folder.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const folderWithIdOnly = await prisma.folder.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends FolderFindManyArgs>(args?: SelectSubset<T, FolderFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$FolderPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Folder.
     * @param {FolderCreateArgs} args - Arguments to create a Folder.
     * @example
     * // Create one Folder
     * const Folder = await prisma.folder.create({
     *   data: {
     *     // ... data to create a Folder
     *   }
     * })
     * 
     */
    create<T extends FolderCreateArgs>(args: SelectSubset<T, FolderCreateArgs<ExtArgs>>): Prisma__FolderClient<$Result.GetResult<Prisma.$FolderPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Folders.
     * @param {FolderCreateManyArgs} args - Arguments to create many Folders.
     * @example
     * // Create many Folders
     * const folder = await prisma.folder.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends FolderCreateManyArgs>(args?: SelectSubset<T, FolderCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a Folder.
     * @param {FolderDeleteArgs} args - Arguments to delete one Folder.
     * @example
     * // Delete one Folder
     * const Folder = await prisma.folder.delete({
     *   where: {
     *     // ... filter to delete one Folder
     *   }
     * })
     * 
     */
    delete<T extends FolderDeleteArgs>(args: SelectSubset<T, FolderDeleteArgs<ExtArgs>>): Prisma__FolderClient<$Result.GetResult<Prisma.$FolderPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Folder.
     * @param {FolderUpdateArgs} args - Arguments to update one Folder.
     * @example
     * // Update one Folder
     * const folder = await prisma.folder.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends FolderUpdateArgs>(args: SelectSubset<T, FolderUpdateArgs<ExtArgs>>): Prisma__FolderClient<$Result.GetResult<Prisma.$FolderPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Folders.
     * @param {FolderDeleteManyArgs} args - Arguments to filter Folders to delete.
     * @example
     * // Delete a few Folders
     * const { count } = await prisma.folder.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends FolderDeleteManyArgs>(args?: SelectSubset<T, FolderDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Folders.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FolderUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Folders
     * const folder = await prisma.folder.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends FolderUpdateManyArgs>(args: SelectSubset<T, FolderUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Folder.
     * @param {FolderUpsertArgs} args - Arguments to update or create a Folder.
     * @example
     * // Update or create a Folder
     * const folder = await prisma.folder.upsert({
     *   create: {
     *     // ... data to create a Folder
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Folder we want to update
     *   }
     * })
     */
    upsert<T extends FolderUpsertArgs>(args: SelectSubset<T, FolderUpsertArgs<ExtArgs>>): Prisma__FolderClient<$Result.GetResult<Prisma.$FolderPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Folders that matches the filter.
     * @param {FolderFindRawArgs} args - Select which filters you would like to apply.
     * @example
     * const folder = await prisma.folder.findRaw({
     *   filter: { age: { $gt: 25 } }
     * })
     */
    findRaw(args?: FolderFindRawArgs): Prisma.PrismaPromise<JsonObject>

    /**
     * Perform aggregation operations on a Folder.
     * @param {FolderAggregateRawArgs} args - Select which aggregations you would like to apply.
     * @example
     * const folder = await prisma.folder.aggregateRaw({
     *   pipeline: [
     *     { $match: { status: "registered" } },
     *     { $group: { _id: "$country", total: { $sum: 1 } } }
     *   ]
     * })
     */
    aggregateRaw(args?: FolderAggregateRawArgs): Prisma.PrismaPromise<JsonObject>


    /**
     * Count the number of Folders.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FolderCountArgs} args - Arguments to filter Folders to count.
     * @example
     * // Count the number of Folders
     * const count = await prisma.folder.count({
     *   where: {
     *     // ... the filter for the Folders we want to count
     *   }
     * })
    **/
    count<T extends FolderCountArgs>(
      args?: Subset<T, FolderCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], FolderCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Folder.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FolderAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends FolderAggregateArgs>(args: Subset<T, FolderAggregateArgs>): Prisma.PrismaPromise<GetFolderAggregateType<T>>

    /**
     * Group by Folder.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FolderGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends FolderGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: FolderGroupByArgs['orderBy'] }
        : { orderBy?: FolderGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, FolderGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetFolderGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Folder model
   */
  readonly fields: FolderFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Folder.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__FolderClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    questionRelations<T extends Folder$questionRelationsArgs<ExtArgs> = {}>(args?: Subset<T, Folder$questionRelationsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$FolderQuestionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Folder model
   */
  interface FolderFieldRefs {
    readonly id: FieldRef<"Folder", 'String'>
    readonly name: FieldRef<"Folder", 'String'>
    readonly userId: FieldRef<"Folder", 'String'>
    readonly createdAt: FieldRef<"Folder", 'DateTime'>
    readonly updatedAt: FieldRef<"Folder", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Folder findUnique
   */
  export type FolderFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Folder
     */
    select?: FolderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Folder
     */
    omit?: FolderOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FolderInclude<ExtArgs> | null
    /**
     * Filter, which Folder to fetch.
     */
    where: FolderWhereUniqueInput
  }

  /**
   * Folder findUniqueOrThrow
   */
  export type FolderFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Folder
     */
    select?: FolderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Folder
     */
    omit?: FolderOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FolderInclude<ExtArgs> | null
    /**
     * Filter, which Folder to fetch.
     */
    where: FolderWhereUniqueInput
  }

  /**
   * Folder findFirst
   */
  export type FolderFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Folder
     */
    select?: FolderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Folder
     */
    omit?: FolderOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FolderInclude<ExtArgs> | null
    /**
     * Filter, which Folder to fetch.
     */
    where?: FolderWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Folders to fetch.
     */
    orderBy?: FolderOrderByWithRelationInput | FolderOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Folders.
     */
    cursor?: FolderWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Folders from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Folders.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Folders.
     */
    distinct?: FolderScalarFieldEnum | FolderScalarFieldEnum[]
  }

  /**
   * Folder findFirstOrThrow
   */
  export type FolderFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Folder
     */
    select?: FolderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Folder
     */
    omit?: FolderOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FolderInclude<ExtArgs> | null
    /**
     * Filter, which Folder to fetch.
     */
    where?: FolderWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Folders to fetch.
     */
    orderBy?: FolderOrderByWithRelationInput | FolderOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Folders.
     */
    cursor?: FolderWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Folders from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Folders.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Folders.
     */
    distinct?: FolderScalarFieldEnum | FolderScalarFieldEnum[]
  }

  /**
   * Folder findMany
   */
  export type FolderFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Folder
     */
    select?: FolderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Folder
     */
    omit?: FolderOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FolderInclude<ExtArgs> | null
    /**
     * Filter, which Folders to fetch.
     */
    where?: FolderWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Folders to fetch.
     */
    orderBy?: FolderOrderByWithRelationInput | FolderOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Folders.
     */
    cursor?: FolderWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Folders from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Folders.
     */
    skip?: number
    distinct?: FolderScalarFieldEnum | FolderScalarFieldEnum[]
  }

  /**
   * Folder create
   */
  export type FolderCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Folder
     */
    select?: FolderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Folder
     */
    omit?: FolderOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FolderInclude<ExtArgs> | null
    /**
     * The data needed to create a Folder.
     */
    data: XOR<FolderCreateInput, FolderUncheckedCreateInput>
  }

  /**
   * Folder createMany
   */
  export type FolderCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Folders.
     */
    data: FolderCreateManyInput | FolderCreateManyInput[]
  }

  /**
   * Folder update
   */
  export type FolderUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Folder
     */
    select?: FolderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Folder
     */
    omit?: FolderOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FolderInclude<ExtArgs> | null
    /**
     * The data needed to update a Folder.
     */
    data: XOR<FolderUpdateInput, FolderUncheckedUpdateInput>
    /**
     * Choose, which Folder to update.
     */
    where: FolderWhereUniqueInput
  }

  /**
   * Folder updateMany
   */
  export type FolderUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Folders.
     */
    data: XOR<FolderUpdateManyMutationInput, FolderUncheckedUpdateManyInput>
    /**
     * Filter which Folders to update
     */
    where?: FolderWhereInput
    /**
     * Limit how many Folders to update.
     */
    limit?: number
  }

  /**
   * Folder upsert
   */
  export type FolderUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Folder
     */
    select?: FolderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Folder
     */
    omit?: FolderOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FolderInclude<ExtArgs> | null
    /**
     * The filter to search for the Folder to update in case it exists.
     */
    where: FolderWhereUniqueInput
    /**
     * In case the Folder found by the `where` argument doesn't exist, create a new Folder with this data.
     */
    create: XOR<FolderCreateInput, FolderUncheckedCreateInput>
    /**
     * In case the Folder was found with the provided `where` argument, update it with this data.
     */
    update: XOR<FolderUpdateInput, FolderUncheckedUpdateInput>
  }

  /**
   * Folder delete
   */
  export type FolderDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Folder
     */
    select?: FolderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Folder
     */
    omit?: FolderOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FolderInclude<ExtArgs> | null
    /**
     * Filter which Folder to delete.
     */
    where: FolderWhereUniqueInput
  }

  /**
   * Folder deleteMany
   */
  export type FolderDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Folders to delete
     */
    where?: FolderWhereInput
    /**
     * Limit how many Folders to delete.
     */
    limit?: number
  }

  /**
   * Folder findRaw
   */
  export type FolderFindRawArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The query predicate filter. If unspecified, then all documents in the collection will match the predicate. ${@link https://docs.mongodb.com/manual/reference/operator/query MongoDB Docs}.
     */
    filter?: InputJsonValue
    /**
     * Additional options to pass to the `find` command ${@link https://docs.mongodb.com/manual/reference/command/find/#command-fields MongoDB Docs}.
     */
    options?: InputJsonValue
  }

  /**
   * Folder aggregateRaw
   */
  export type FolderAggregateRawArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * An array of aggregation stages to process and transform the document stream via the aggregation pipeline. ${@link https://docs.mongodb.com/manual/reference/operator/aggregation-pipeline MongoDB Docs}.
     */
    pipeline?: InputJsonValue[]
    /**
     * Additional options to pass to the `aggregate` command ${@link https://docs.mongodb.com/manual/reference/command/aggregate/#command-fields MongoDB Docs}.
     */
    options?: InputJsonValue
  }

  /**
   * Folder.questionRelations
   */
  export type Folder$questionRelationsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FolderQuestion
     */
    select?: FolderQuestionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the FolderQuestion
     */
    omit?: FolderQuestionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FolderQuestionInclude<ExtArgs> | null
    where?: FolderQuestionWhereInput
    orderBy?: FolderQuestionOrderByWithRelationInput | FolderQuestionOrderByWithRelationInput[]
    cursor?: FolderQuestionWhereUniqueInput
    take?: number
    skip?: number
    distinct?: FolderQuestionScalarFieldEnum | FolderQuestionScalarFieldEnum[]
  }

  /**
   * Folder without action
   */
  export type FolderDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Folder
     */
    select?: FolderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Folder
     */
    omit?: FolderOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FolderInclude<ExtArgs> | null
  }


  /**
   * Model FolderQuestion
   */

  export type AggregateFolderQuestion = {
    _count: FolderQuestionCountAggregateOutputType | null
    _min: FolderQuestionMinAggregateOutputType | null
    _max: FolderQuestionMaxAggregateOutputType | null
  }

  export type FolderQuestionMinAggregateOutputType = {
    id: string | null
    folderId: string | null
    questionId: string | null
  }

  export type FolderQuestionMaxAggregateOutputType = {
    id: string | null
    folderId: string | null
    questionId: string | null
  }

  export type FolderQuestionCountAggregateOutputType = {
    id: number
    folderId: number
    questionId: number
    _all: number
  }


  export type FolderQuestionMinAggregateInputType = {
    id?: true
    folderId?: true
    questionId?: true
  }

  export type FolderQuestionMaxAggregateInputType = {
    id?: true
    folderId?: true
    questionId?: true
  }

  export type FolderQuestionCountAggregateInputType = {
    id?: true
    folderId?: true
    questionId?: true
    _all?: true
  }

  export type FolderQuestionAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which FolderQuestion to aggregate.
     */
    where?: FolderQuestionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of FolderQuestions to fetch.
     */
    orderBy?: FolderQuestionOrderByWithRelationInput | FolderQuestionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: FolderQuestionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` FolderQuestions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` FolderQuestions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned FolderQuestions
    **/
    _count?: true | FolderQuestionCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: FolderQuestionMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: FolderQuestionMaxAggregateInputType
  }

  export type GetFolderQuestionAggregateType<T extends FolderQuestionAggregateArgs> = {
        [P in keyof T & keyof AggregateFolderQuestion]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateFolderQuestion[P]>
      : GetScalarType<T[P], AggregateFolderQuestion[P]>
  }




  export type FolderQuestionGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: FolderQuestionWhereInput
    orderBy?: FolderQuestionOrderByWithAggregationInput | FolderQuestionOrderByWithAggregationInput[]
    by: FolderQuestionScalarFieldEnum[] | FolderQuestionScalarFieldEnum
    having?: FolderQuestionScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: FolderQuestionCountAggregateInputType | true
    _min?: FolderQuestionMinAggregateInputType
    _max?: FolderQuestionMaxAggregateInputType
  }

  export type FolderQuestionGroupByOutputType = {
    id: string
    folderId: string
    questionId: string
    _count: FolderQuestionCountAggregateOutputType | null
    _min: FolderQuestionMinAggregateOutputType | null
    _max: FolderQuestionMaxAggregateOutputType | null
  }

  type GetFolderQuestionGroupByPayload<T extends FolderQuestionGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<FolderQuestionGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof FolderQuestionGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], FolderQuestionGroupByOutputType[P]>
            : GetScalarType<T[P], FolderQuestionGroupByOutputType[P]>
        }
      >
    >


  export type FolderQuestionSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    folderId?: boolean
    questionId?: boolean
    folder?: boolean | FolderDefaultArgs<ExtArgs>
    question?: boolean | QuestionDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["folderQuestion"]>



  export type FolderQuestionSelectScalar = {
    id?: boolean
    folderId?: boolean
    questionId?: boolean
  }

  export type FolderQuestionOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "folderId" | "questionId", ExtArgs["result"]["folderQuestion"]>
  export type FolderQuestionInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    folder?: boolean | FolderDefaultArgs<ExtArgs>
    question?: boolean | QuestionDefaultArgs<ExtArgs>
  }

  export type $FolderQuestionPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "FolderQuestion"
    objects: {
      folder: Prisma.$FolderPayload<ExtArgs>
      question: Prisma.$QuestionPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      folderId: string
      questionId: string
    }, ExtArgs["result"]["folderQuestion"]>
    composites: {}
  }

  type FolderQuestionGetPayload<S extends boolean | null | undefined | FolderQuestionDefaultArgs> = $Result.GetResult<Prisma.$FolderQuestionPayload, S>

  type FolderQuestionCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<FolderQuestionFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: FolderQuestionCountAggregateInputType | true
    }

  export interface FolderQuestionDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['FolderQuestion'], meta: { name: 'FolderQuestion' } }
    /**
     * Find zero or one FolderQuestion that matches the filter.
     * @param {FolderQuestionFindUniqueArgs} args - Arguments to find a FolderQuestion
     * @example
     * // Get one FolderQuestion
     * const folderQuestion = await prisma.folderQuestion.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends FolderQuestionFindUniqueArgs>(args: SelectSubset<T, FolderQuestionFindUniqueArgs<ExtArgs>>): Prisma__FolderQuestionClient<$Result.GetResult<Prisma.$FolderQuestionPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one FolderQuestion that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {FolderQuestionFindUniqueOrThrowArgs} args - Arguments to find a FolderQuestion
     * @example
     * // Get one FolderQuestion
     * const folderQuestion = await prisma.folderQuestion.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends FolderQuestionFindUniqueOrThrowArgs>(args: SelectSubset<T, FolderQuestionFindUniqueOrThrowArgs<ExtArgs>>): Prisma__FolderQuestionClient<$Result.GetResult<Prisma.$FolderQuestionPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first FolderQuestion that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FolderQuestionFindFirstArgs} args - Arguments to find a FolderQuestion
     * @example
     * // Get one FolderQuestion
     * const folderQuestion = await prisma.folderQuestion.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends FolderQuestionFindFirstArgs>(args?: SelectSubset<T, FolderQuestionFindFirstArgs<ExtArgs>>): Prisma__FolderQuestionClient<$Result.GetResult<Prisma.$FolderQuestionPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first FolderQuestion that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FolderQuestionFindFirstOrThrowArgs} args - Arguments to find a FolderQuestion
     * @example
     * // Get one FolderQuestion
     * const folderQuestion = await prisma.folderQuestion.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends FolderQuestionFindFirstOrThrowArgs>(args?: SelectSubset<T, FolderQuestionFindFirstOrThrowArgs<ExtArgs>>): Prisma__FolderQuestionClient<$Result.GetResult<Prisma.$FolderQuestionPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more FolderQuestions that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FolderQuestionFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all FolderQuestions
     * const folderQuestions = await prisma.folderQuestion.findMany()
     * 
     * // Get first 10 FolderQuestions
     * const folderQuestions = await prisma.folderQuestion.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const folderQuestionWithIdOnly = await prisma.folderQuestion.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends FolderQuestionFindManyArgs>(args?: SelectSubset<T, FolderQuestionFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$FolderQuestionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a FolderQuestion.
     * @param {FolderQuestionCreateArgs} args - Arguments to create a FolderQuestion.
     * @example
     * // Create one FolderQuestion
     * const FolderQuestion = await prisma.folderQuestion.create({
     *   data: {
     *     // ... data to create a FolderQuestion
     *   }
     * })
     * 
     */
    create<T extends FolderQuestionCreateArgs>(args: SelectSubset<T, FolderQuestionCreateArgs<ExtArgs>>): Prisma__FolderQuestionClient<$Result.GetResult<Prisma.$FolderQuestionPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many FolderQuestions.
     * @param {FolderQuestionCreateManyArgs} args - Arguments to create many FolderQuestions.
     * @example
     * // Create many FolderQuestions
     * const folderQuestion = await prisma.folderQuestion.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends FolderQuestionCreateManyArgs>(args?: SelectSubset<T, FolderQuestionCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a FolderQuestion.
     * @param {FolderQuestionDeleteArgs} args - Arguments to delete one FolderQuestion.
     * @example
     * // Delete one FolderQuestion
     * const FolderQuestion = await prisma.folderQuestion.delete({
     *   where: {
     *     // ... filter to delete one FolderQuestion
     *   }
     * })
     * 
     */
    delete<T extends FolderQuestionDeleteArgs>(args: SelectSubset<T, FolderQuestionDeleteArgs<ExtArgs>>): Prisma__FolderQuestionClient<$Result.GetResult<Prisma.$FolderQuestionPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one FolderQuestion.
     * @param {FolderQuestionUpdateArgs} args - Arguments to update one FolderQuestion.
     * @example
     * // Update one FolderQuestion
     * const folderQuestion = await prisma.folderQuestion.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends FolderQuestionUpdateArgs>(args: SelectSubset<T, FolderQuestionUpdateArgs<ExtArgs>>): Prisma__FolderQuestionClient<$Result.GetResult<Prisma.$FolderQuestionPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more FolderQuestions.
     * @param {FolderQuestionDeleteManyArgs} args - Arguments to filter FolderQuestions to delete.
     * @example
     * // Delete a few FolderQuestions
     * const { count } = await prisma.folderQuestion.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends FolderQuestionDeleteManyArgs>(args?: SelectSubset<T, FolderQuestionDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more FolderQuestions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FolderQuestionUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many FolderQuestions
     * const folderQuestion = await prisma.folderQuestion.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends FolderQuestionUpdateManyArgs>(args: SelectSubset<T, FolderQuestionUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one FolderQuestion.
     * @param {FolderQuestionUpsertArgs} args - Arguments to update or create a FolderQuestion.
     * @example
     * // Update or create a FolderQuestion
     * const folderQuestion = await prisma.folderQuestion.upsert({
     *   create: {
     *     // ... data to create a FolderQuestion
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the FolderQuestion we want to update
     *   }
     * })
     */
    upsert<T extends FolderQuestionUpsertArgs>(args: SelectSubset<T, FolderQuestionUpsertArgs<ExtArgs>>): Prisma__FolderQuestionClient<$Result.GetResult<Prisma.$FolderQuestionPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more FolderQuestions that matches the filter.
     * @param {FolderQuestionFindRawArgs} args - Select which filters you would like to apply.
     * @example
     * const folderQuestion = await prisma.folderQuestion.findRaw({
     *   filter: { age: { $gt: 25 } }
     * })
     */
    findRaw(args?: FolderQuestionFindRawArgs): Prisma.PrismaPromise<JsonObject>

    /**
     * Perform aggregation operations on a FolderQuestion.
     * @param {FolderQuestionAggregateRawArgs} args - Select which aggregations you would like to apply.
     * @example
     * const folderQuestion = await prisma.folderQuestion.aggregateRaw({
     *   pipeline: [
     *     { $match: { status: "registered" } },
     *     { $group: { _id: "$country", total: { $sum: 1 } } }
     *   ]
     * })
     */
    aggregateRaw(args?: FolderQuestionAggregateRawArgs): Prisma.PrismaPromise<JsonObject>


    /**
     * Count the number of FolderQuestions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FolderQuestionCountArgs} args - Arguments to filter FolderQuestions to count.
     * @example
     * // Count the number of FolderQuestions
     * const count = await prisma.folderQuestion.count({
     *   where: {
     *     // ... the filter for the FolderQuestions we want to count
     *   }
     * })
    **/
    count<T extends FolderQuestionCountArgs>(
      args?: Subset<T, FolderQuestionCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], FolderQuestionCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a FolderQuestion.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FolderQuestionAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends FolderQuestionAggregateArgs>(args: Subset<T, FolderQuestionAggregateArgs>): Prisma.PrismaPromise<GetFolderQuestionAggregateType<T>>

    /**
     * Group by FolderQuestion.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FolderQuestionGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends FolderQuestionGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: FolderQuestionGroupByArgs['orderBy'] }
        : { orderBy?: FolderQuestionGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, FolderQuestionGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetFolderQuestionGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the FolderQuestion model
   */
  readonly fields: FolderQuestionFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for FolderQuestion.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__FolderQuestionClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    folder<T extends FolderDefaultArgs<ExtArgs> = {}>(args?: Subset<T, FolderDefaultArgs<ExtArgs>>): Prisma__FolderClient<$Result.GetResult<Prisma.$FolderPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    question<T extends QuestionDefaultArgs<ExtArgs> = {}>(args?: Subset<T, QuestionDefaultArgs<ExtArgs>>): Prisma__QuestionClient<$Result.GetResult<Prisma.$QuestionPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the FolderQuestion model
   */
  interface FolderQuestionFieldRefs {
    readonly id: FieldRef<"FolderQuestion", 'String'>
    readonly folderId: FieldRef<"FolderQuestion", 'String'>
    readonly questionId: FieldRef<"FolderQuestion", 'String'>
  }
    

  // Custom InputTypes
  /**
   * FolderQuestion findUnique
   */
  export type FolderQuestionFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FolderQuestion
     */
    select?: FolderQuestionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the FolderQuestion
     */
    omit?: FolderQuestionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FolderQuestionInclude<ExtArgs> | null
    /**
     * Filter, which FolderQuestion to fetch.
     */
    where: FolderQuestionWhereUniqueInput
  }

  /**
   * FolderQuestion findUniqueOrThrow
   */
  export type FolderQuestionFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FolderQuestion
     */
    select?: FolderQuestionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the FolderQuestion
     */
    omit?: FolderQuestionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FolderQuestionInclude<ExtArgs> | null
    /**
     * Filter, which FolderQuestion to fetch.
     */
    where: FolderQuestionWhereUniqueInput
  }

  /**
   * FolderQuestion findFirst
   */
  export type FolderQuestionFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FolderQuestion
     */
    select?: FolderQuestionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the FolderQuestion
     */
    omit?: FolderQuestionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FolderQuestionInclude<ExtArgs> | null
    /**
     * Filter, which FolderQuestion to fetch.
     */
    where?: FolderQuestionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of FolderQuestions to fetch.
     */
    orderBy?: FolderQuestionOrderByWithRelationInput | FolderQuestionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for FolderQuestions.
     */
    cursor?: FolderQuestionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` FolderQuestions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` FolderQuestions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of FolderQuestions.
     */
    distinct?: FolderQuestionScalarFieldEnum | FolderQuestionScalarFieldEnum[]
  }

  /**
   * FolderQuestion findFirstOrThrow
   */
  export type FolderQuestionFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FolderQuestion
     */
    select?: FolderQuestionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the FolderQuestion
     */
    omit?: FolderQuestionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FolderQuestionInclude<ExtArgs> | null
    /**
     * Filter, which FolderQuestion to fetch.
     */
    where?: FolderQuestionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of FolderQuestions to fetch.
     */
    orderBy?: FolderQuestionOrderByWithRelationInput | FolderQuestionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for FolderQuestions.
     */
    cursor?: FolderQuestionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` FolderQuestions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` FolderQuestions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of FolderQuestions.
     */
    distinct?: FolderQuestionScalarFieldEnum | FolderQuestionScalarFieldEnum[]
  }

  /**
   * FolderQuestion findMany
   */
  export type FolderQuestionFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FolderQuestion
     */
    select?: FolderQuestionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the FolderQuestion
     */
    omit?: FolderQuestionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FolderQuestionInclude<ExtArgs> | null
    /**
     * Filter, which FolderQuestions to fetch.
     */
    where?: FolderQuestionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of FolderQuestions to fetch.
     */
    orderBy?: FolderQuestionOrderByWithRelationInput | FolderQuestionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing FolderQuestions.
     */
    cursor?: FolderQuestionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` FolderQuestions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` FolderQuestions.
     */
    skip?: number
    distinct?: FolderQuestionScalarFieldEnum | FolderQuestionScalarFieldEnum[]
  }

  /**
   * FolderQuestion create
   */
  export type FolderQuestionCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FolderQuestion
     */
    select?: FolderQuestionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the FolderQuestion
     */
    omit?: FolderQuestionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FolderQuestionInclude<ExtArgs> | null
    /**
     * The data needed to create a FolderQuestion.
     */
    data: XOR<FolderQuestionCreateInput, FolderQuestionUncheckedCreateInput>
  }

  /**
   * FolderQuestion createMany
   */
  export type FolderQuestionCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many FolderQuestions.
     */
    data: FolderQuestionCreateManyInput | FolderQuestionCreateManyInput[]
  }

  /**
   * FolderQuestion update
   */
  export type FolderQuestionUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FolderQuestion
     */
    select?: FolderQuestionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the FolderQuestion
     */
    omit?: FolderQuestionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FolderQuestionInclude<ExtArgs> | null
    /**
     * The data needed to update a FolderQuestion.
     */
    data: XOR<FolderQuestionUpdateInput, FolderQuestionUncheckedUpdateInput>
    /**
     * Choose, which FolderQuestion to update.
     */
    where: FolderQuestionWhereUniqueInput
  }

  /**
   * FolderQuestion updateMany
   */
  export type FolderQuestionUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update FolderQuestions.
     */
    data: XOR<FolderQuestionUpdateManyMutationInput, FolderQuestionUncheckedUpdateManyInput>
    /**
     * Filter which FolderQuestions to update
     */
    where?: FolderQuestionWhereInput
    /**
     * Limit how many FolderQuestions to update.
     */
    limit?: number
  }

  /**
   * FolderQuestion upsert
   */
  export type FolderQuestionUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FolderQuestion
     */
    select?: FolderQuestionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the FolderQuestion
     */
    omit?: FolderQuestionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FolderQuestionInclude<ExtArgs> | null
    /**
     * The filter to search for the FolderQuestion to update in case it exists.
     */
    where: FolderQuestionWhereUniqueInput
    /**
     * In case the FolderQuestion found by the `where` argument doesn't exist, create a new FolderQuestion with this data.
     */
    create: XOR<FolderQuestionCreateInput, FolderQuestionUncheckedCreateInput>
    /**
     * In case the FolderQuestion was found with the provided `where` argument, update it with this data.
     */
    update: XOR<FolderQuestionUpdateInput, FolderQuestionUncheckedUpdateInput>
  }

  /**
   * FolderQuestion delete
   */
  export type FolderQuestionDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FolderQuestion
     */
    select?: FolderQuestionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the FolderQuestion
     */
    omit?: FolderQuestionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FolderQuestionInclude<ExtArgs> | null
    /**
     * Filter which FolderQuestion to delete.
     */
    where: FolderQuestionWhereUniqueInput
  }

  /**
   * FolderQuestion deleteMany
   */
  export type FolderQuestionDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which FolderQuestions to delete
     */
    where?: FolderQuestionWhereInput
    /**
     * Limit how many FolderQuestions to delete.
     */
    limit?: number
  }

  /**
   * FolderQuestion findRaw
   */
  export type FolderQuestionFindRawArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The query predicate filter. If unspecified, then all documents in the collection will match the predicate. ${@link https://docs.mongodb.com/manual/reference/operator/query MongoDB Docs}.
     */
    filter?: InputJsonValue
    /**
     * Additional options to pass to the `find` command ${@link https://docs.mongodb.com/manual/reference/command/find/#command-fields MongoDB Docs}.
     */
    options?: InputJsonValue
  }

  /**
   * FolderQuestion aggregateRaw
   */
  export type FolderQuestionAggregateRawArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * An array of aggregation stages to process and transform the document stream via the aggregation pipeline. ${@link https://docs.mongodb.com/manual/reference/operator/aggregation-pipeline MongoDB Docs}.
     */
    pipeline?: InputJsonValue[]
    /**
     * Additional options to pass to the `aggregate` command ${@link https://docs.mongodb.com/manual/reference/command/aggregate/#command-fields MongoDB Docs}.
     */
    options?: InputJsonValue
  }

  /**
   * FolderQuestion without action
   */
  export type FolderQuestionDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FolderQuestion
     */
    select?: FolderQuestionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the FolderQuestion
     */
    omit?: FolderQuestionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FolderQuestionInclude<ExtArgs> | null
  }


  /**
   * Model TemplateForm
   */

  export type AggregateTemplateForm = {
    _count: TemplateFormCountAggregateOutputType | null
    _min: TemplateFormMinAggregateOutputType | null
    _max: TemplateFormMaxAggregateOutputType | null
  }

  export type TemplateFormMinAggregateOutputType = {
    id: string | null
    userId: string | null
    templateName: string | null
    institutionAddress: string | null
    institution: string | null
    marks: string | null
    time: string | null
    exam: string | null
    subject: string | null
    logo: string | null
    saveTemplate: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type TemplateFormMaxAggregateOutputType = {
    id: string | null
    userId: string | null
    templateName: string | null
    institutionAddress: string | null
    institution: string | null
    marks: string | null
    time: string | null
    exam: string | null
    subject: string | null
    logo: string | null
    saveTemplate: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type TemplateFormCountAggregateOutputType = {
    id: number
    userId: number
    templateName: number
    institutionAddress: number
    institution: number
    marks: number
    time: number
    exam: number
    subject: number
    logo: number
    saveTemplate: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type TemplateFormMinAggregateInputType = {
    id?: true
    userId?: true
    templateName?: true
    institutionAddress?: true
    institution?: true
    marks?: true
    time?: true
    exam?: true
    subject?: true
    logo?: true
    saveTemplate?: true
    createdAt?: true
    updatedAt?: true
  }

  export type TemplateFormMaxAggregateInputType = {
    id?: true
    userId?: true
    templateName?: true
    institutionAddress?: true
    institution?: true
    marks?: true
    time?: true
    exam?: true
    subject?: true
    logo?: true
    saveTemplate?: true
    createdAt?: true
    updatedAt?: true
  }

  export type TemplateFormCountAggregateInputType = {
    id?: true
    userId?: true
    templateName?: true
    institutionAddress?: true
    institution?: true
    marks?: true
    time?: true
    exam?: true
    subject?: true
    logo?: true
    saveTemplate?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type TemplateFormAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TemplateForm to aggregate.
     */
    where?: TemplateFormWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TemplateForms to fetch.
     */
    orderBy?: TemplateFormOrderByWithRelationInput | TemplateFormOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: TemplateFormWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TemplateForms from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TemplateForms.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned TemplateForms
    **/
    _count?: true | TemplateFormCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: TemplateFormMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: TemplateFormMaxAggregateInputType
  }

  export type GetTemplateFormAggregateType<T extends TemplateFormAggregateArgs> = {
        [P in keyof T & keyof AggregateTemplateForm]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTemplateForm[P]>
      : GetScalarType<T[P], AggregateTemplateForm[P]>
  }




  export type TemplateFormGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TemplateFormWhereInput
    orderBy?: TemplateFormOrderByWithAggregationInput | TemplateFormOrderByWithAggregationInput[]
    by: TemplateFormScalarFieldEnum[] | TemplateFormScalarFieldEnum
    having?: TemplateFormScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: TemplateFormCountAggregateInputType | true
    _min?: TemplateFormMinAggregateInputType
    _max?: TemplateFormMaxAggregateInputType
  }

  export type TemplateFormGroupByOutputType = {
    id: string
    userId: string
    templateName: string
    institutionAddress: string | null
    institution: string | null
    marks: string | null
    time: string | null
    exam: string | null
    subject: string | null
    logo: string | null
    saveTemplate: boolean
    createdAt: Date
    updatedAt: Date
    _count: TemplateFormCountAggregateOutputType | null
    _min: TemplateFormMinAggregateOutputType | null
    _max: TemplateFormMaxAggregateOutputType | null
  }

  type GetTemplateFormGroupByPayload<T extends TemplateFormGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<TemplateFormGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof TemplateFormGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], TemplateFormGroupByOutputType[P]>
            : GetScalarType<T[P], TemplateFormGroupByOutputType[P]>
        }
      >
    >


  export type TemplateFormSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    templateName?: boolean
    institutionAddress?: boolean
    institution?: boolean
    marks?: boolean
    time?: boolean
    exam?: boolean
    subject?: boolean
    logo?: boolean
    saveTemplate?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["templateForm"]>



  export type TemplateFormSelectScalar = {
    id?: boolean
    userId?: boolean
    templateName?: boolean
    institutionAddress?: boolean
    institution?: boolean
    marks?: boolean
    time?: boolean
    exam?: boolean
    subject?: boolean
    logo?: boolean
    saveTemplate?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type TemplateFormOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "userId" | "templateName" | "institutionAddress" | "institution" | "marks" | "time" | "exam" | "subject" | "logo" | "saveTemplate" | "createdAt" | "updatedAt", ExtArgs["result"]["templateForm"]>
  export type TemplateFormInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $TemplateFormPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "TemplateForm"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      userId: string
      templateName: string
      institutionAddress: string | null
      institution: string | null
      marks: string | null
      time: string | null
      exam: string | null
      subject: string | null
      logo: string | null
      saveTemplate: boolean
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["templateForm"]>
    composites: {}
  }

  type TemplateFormGetPayload<S extends boolean | null | undefined | TemplateFormDefaultArgs> = $Result.GetResult<Prisma.$TemplateFormPayload, S>

  type TemplateFormCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<TemplateFormFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: TemplateFormCountAggregateInputType | true
    }

  export interface TemplateFormDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['TemplateForm'], meta: { name: 'TemplateForm' } }
    /**
     * Find zero or one TemplateForm that matches the filter.
     * @param {TemplateFormFindUniqueArgs} args - Arguments to find a TemplateForm
     * @example
     * // Get one TemplateForm
     * const templateForm = await prisma.templateForm.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends TemplateFormFindUniqueArgs>(args: SelectSubset<T, TemplateFormFindUniqueArgs<ExtArgs>>): Prisma__TemplateFormClient<$Result.GetResult<Prisma.$TemplateFormPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one TemplateForm that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {TemplateFormFindUniqueOrThrowArgs} args - Arguments to find a TemplateForm
     * @example
     * // Get one TemplateForm
     * const templateForm = await prisma.templateForm.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends TemplateFormFindUniqueOrThrowArgs>(args: SelectSubset<T, TemplateFormFindUniqueOrThrowArgs<ExtArgs>>): Prisma__TemplateFormClient<$Result.GetResult<Prisma.$TemplateFormPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first TemplateForm that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TemplateFormFindFirstArgs} args - Arguments to find a TemplateForm
     * @example
     * // Get one TemplateForm
     * const templateForm = await prisma.templateForm.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends TemplateFormFindFirstArgs>(args?: SelectSubset<T, TemplateFormFindFirstArgs<ExtArgs>>): Prisma__TemplateFormClient<$Result.GetResult<Prisma.$TemplateFormPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first TemplateForm that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TemplateFormFindFirstOrThrowArgs} args - Arguments to find a TemplateForm
     * @example
     * // Get one TemplateForm
     * const templateForm = await prisma.templateForm.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends TemplateFormFindFirstOrThrowArgs>(args?: SelectSubset<T, TemplateFormFindFirstOrThrowArgs<ExtArgs>>): Prisma__TemplateFormClient<$Result.GetResult<Prisma.$TemplateFormPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more TemplateForms that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TemplateFormFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all TemplateForms
     * const templateForms = await prisma.templateForm.findMany()
     * 
     * // Get first 10 TemplateForms
     * const templateForms = await prisma.templateForm.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const templateFormWithIdOnly = await prisma.templateForm.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends TemplateFormFindManyArgs>(args?: SelectSubset<T, TemplateFormFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TemplateFormPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a TemplateForm.
     * @param {TemplateFormCreateArgs} args - Arguments to create a TemplateForm.
     * @example
     * // Create one TemplateForm
     * const TemplateForm = await prisma.templateForm.create({
     *   data: {
     *     // ... data to create a TemplateForm
     *   }
     * })
     * 
     */
    create<T extends TemplateFormCreateArgs>(args: SelectSubset<T, TemplateFormCreateArgs<ExtArgs>>): Prisma__TemplateFormClient<$Result.GetResult<Prisma.$TemplateFormPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many TemplateForms.
     * @param {TemplateFormCreateManyArgs} args - Arguments to create many TemplateForms.
     * @example
     * // Create many TemplateForms
     * const templateForm = await prisma.templateForm.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends TemplateFormCreateManyArgs>(args?: SelectSubset<T, TemplateFormCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a TemplateForm.
     * @param {TemplateFormDeleteArgs} args - Arguments to delete one TemplateForm.
     * @example
     * // Delete one TemplateForm
     * const TemplateForm = await prisma.templateForm.delete({
     *   where: {
     *     // ... filter to delete one TemplateForm
     *   }
     * })
     * 
     */
    delete<T extends TemplateFormDeleteArgs>(args: SelectSubset<T, TemplateFormDeleteArgs<ExtArgs>>): Prisma__TemplateFormClient<$Result.GetResult<Prisma.$TemplateFormPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one TemplateForm.
     * @param {TemplateFormUpdateArgs} args - Arguments to update one TemplateForm.
     * @example
     * // Update one TemplateForm
     * const templateForm = await prisma.templateForm.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends TemplateFormUpdateArgs>(args: SelectSubset<T, TemplateFormUpdateArgs<ExtArgs>>): Prisma__TemplateFormClient<$Result.GetResult<Prisma.$TemplateFormPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more TemplateForms.
     * @param {TemplateFormDeleteManyArgs} args - Arguments to filter TemplateForms to delete.
     * @example
     * // Delete a few TemplateForms
     * const { count } = await prisma.templateForm.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends TemplateFormDeleteManyArgs>(args?: SelectSubset<T, TemplateFormDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more TemplateForms.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TemplateFormUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many TemplateForms
     * const templateForm = await prisma.templateForm.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends TemplateFormUpdateManyArgs>(args: SelectSubset<T, TemplateFormUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one TemplateForm.
     * @param {TemplateFormUpsertArgs} args - Arguments to update or create a TemplateForm.
     * @example
     * // Update or create a TemplateForm
     * const templateForm = await prisma.templateForm.upsert({
     *   create: {
     *     // ... data to create a TemplateForm
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the TemplateForm we want to update
     *   }
     * })
     */
    upsert<T extends TemplateFormUpsertArgs>(args: SelectSubset<T, TemplateFormUpsertArgs<ExtArgs>>): Prisma__TemplateFormClient<$Result.GetResult<Prisma.$TemplateFormPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more TemplateForms that matches the filter.
     * @param {TemplateFormFindRawArgs} args - Select which filters you would like to apply.
     * @example
     * const templateForm = await prisma.templateForm.findRaw({
     *   filter: { age: { $gt: 25 } }
     * })
     */
    findRaw(args?: TemplateFormFindRawArgs): Prisma.PrismaPromise<JsonObject>

    /**
     * Perform aggregation operations on a TemplateForm.
     * @param {TemplateFormAggregateRawArgs} args - Select which aggregations you would like to apply.
     * @example
     * const templateForm = await prisma.templateForm.aggregateRaw({
     *   pipeline: [
     *     { $match: { status: "registered" } },
     *     { $group: { _id: "$country", total: { $sum: 1 } } }
     *   ]
     * })
     */
    aggregateRaw(args?: TemplateFormAggregateRawArgs): Prisma.PrismaPromise<JsonObject>


    /**
     * Count the number of TemplateForms.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TemplateFormCountArgs} args - Arguments to filter TemplateForms to count.
     * @example
     * // Count the number of TemplateForms
     * const count = await prisma.templateForm.count({
     *   where: {
     *     // ... the filter for the TemplateForms we want to count
     *   }
     * })
    **/
    count<T extends TemplateFormCountArgs>(
      args?: Subset<T, TemplateFormCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], TemplateFormCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a TemplateForm.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TemplateFormAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends TemplateFormAggregateArgs>(args: Subset<T, TemplateFormAggregateArgs>): Prisma.PrismaPromise<GetTemplateFormAggregateType<T>>

    /**
     * Group by TemplateForm.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TemplateFormGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends TemplateFormGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: TemplateFormGroupByArgs['orderBy'] }
        : { orderBy?: TemplateFormGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, TemplateFormGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTemplateFormGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the TemplateForm model
   */
  readonly fields: TemplateFormFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for TemplateForm.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__TemplateFormClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the TemplateForm model
   */
  interface TemplateFormFieldRefs {
    readonly id: FieldRef<"TemplateForm", 'String'>
    readonly userId: FieldRef<"TemplateForm", 'String'>
    readonly templateName: FieldRef<"TemplateForm", 'String'>
    readonly institutionAddress: FieldRef<"TemplateForm", 'String'>
    readonly institution: FieldRef<"TemplateForm", 'String'>
    readonly marks: FieldRef<"TemplateForm", 'String'>
    readonly time: FieldRef<"TemplateForm", 'String'>
    readonly exam: FieldRef<"TemplateForm", 'String'>
    readonly subject: FieldRef<"TemplateForm", 'String'>
    readonly logo: FieldRef<"TemplateForm", 'String'>
    readonly saveTemplate: FieldRef<"TemplateForm", 'Boolean'>
    readonly createdAt: FieldRef<"TemplateForm", 'DateTime'>
    readonly updatedAt: FieldRef<"TemplateForm", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * TemplateForm findUnique
   */
  export type TemplateFormFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TemplateForm
     */
    select?: TemplateFormSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TemplateForm
     */
    omit?: TemplateFormOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TemplateFormInclude<ExtArgs> | null
    /**
     * Filter, which TemplateForm to fetch.
     */
    where: TemplateFormWhereUniqueInput
  }

  /**
   * TemplateForm findUniqueOrThrow
   */
  export type TemplateFormFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TemplateForm
     */
    select?: TemplateFormSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TemplateForm
     */
    omit?: TemplateFormOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TemplateFormInclude<ExtArgs> | null
    /**
     * Filter, which TemplateForm to fetch.
     */
    where: TemplateFormWhereUniqueInput
  }

  /**
   * TemplateForm findFirst
   */
  export type TemplateFormFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TemplateForm
     */
    select?: TemplateFormSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TemplateForm
     */
    omit?: TemplateFormOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TemplateFormInclude<ExtArgs> | null
    /**
     * Filter, which TemplateForm to fetch.
     */
    where?: TemplateFormWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TemplateForms to fetch.
     */
    orderBy?: TemplateFormOrderByWithRelationInput | TemplateFormOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TemplateForms.
     */
    cursor?: TemplateFormWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TemplateForms from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TemplateForms.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TemplateForms.
     */
    distinct?: TemplateFormScalarFieldEnum | TemplateFormScalarFieldEnum[]
  }

  /**
   * TemplateForm findFirstOrThrow
   */
  export type TemplateFormFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TemplateForm
     */
    select?: TemplateFormSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TemplateForm
     */
    omit?: TemplateFormOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TemplateFormInclude<ExtArgs> | null
    /**
     * Filter, which TemplateForm to fetch.
     */
    where?: TemplateFormWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TemplateForms to fetch.
     */
    orderBy?: TemplateFormOrderByWithRelationInput | TemplateFormOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TemplateForms.
     */
    cursor?: TemplateFormWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TemplateForms from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TemplateForms.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TemplateForms.
     */
    distinct?: TemplateFormScalarFieldEnum | TemplateFormScalarFieldEnum[]
  }

  /**
   * TemplateForm findMany
   */
  export type TemplateFormFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TemplateForm
     */
    select?: TemplateFormSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TemplateForm
     */
    omit?: TemplateFormOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TemplateFormInclude<ExtArgs> | null
    /**
     * Filter, which TemplateForms to fetch.
     */
    where?: TemplateFormWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TemplateForms to fetch.
     */
    orderBy?: TemplateFormOrderByWithRelationInput | TemplateFormOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing TemplateForms.
     */
    cursor?: TemplateFormWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TemplateForms from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TemplateForms.
     */
    skip?: number
    distinct?: TemplateFormScalarFieldEnum | TemplateFormScalarFieldEnum[]
  }

  /**
   * TemplateForm create
   */
  export type TemplateFormCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TemplateForm
     */
    select?: TemplateFormSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TemplateForm
     */
    omit?: TemplateFormOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TemplateFormInclude<ExtArgs> | null
    /**
     * The data needed to create a TemplateForm.
     */
    data: XOR<TemplateFormCreateInput, TemplateFormUncheckedCreateInput>
  }

  /**
   * TemplateForm createMany
   */
  export type TemplateFormCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many TemplateForms.
     */
    data: TemplateFormCreateManyInput | TemplateFormCreateManyInput[]
  }

  /**
   * TemplateForm update
   */
  export type TemplateFormUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TemplateForm
     */
    select?: TemplateFormSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TemplateForm
     */
    omit?: TemplateFormOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TemplateFormInclude<ExtArgs> | null
    /**
     * The data needed to update a TemplateForm.
     */
    data: XOR<TemplateFormUpdateInput, TemplateFormUncheckedUpdateInput>
    /**
     * Choose, which TemplateForm to update.
     */
    where: TemplateFormWhereUniqueInput
  }

  /**
   * TemplateForm updateMany
   */
  export type TemplateFormUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update TemplateForms.
     */
    data: XOR<TemplateFormUpdateManyMutationInput, TemplateFormUncheckedUpdateManyInput>
    /**
     * Filter which TemplateForms to update
     */
    where?: TemplateFormWhereInput
    /**
     * Limit how many TemplateForms to update.
     */
    limit?: number
  }

  /**
   * TemplateForm upsert
   */
  export type TemplateFormUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TemplateForm
     */
    select?: TemplateFormSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TemplateForm
     */
    omit?: TemplateFormOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TemplateFormInclude<ExtArgs> | null
    /**
     * The filter to search for the TemplateForm to update in case it exists.
     */
    where: TemplateFormWhereUniqueInput
    /**
     * In case the TemplateForm found by the `where` argument doesn't exist, create a new TemplateForm with this data.
     */
    create: XOR<TemplateFormCreateInput, TemplateFormUncheckedCreateInput>
    /**
     * In case the TemplateForm was found with the provided `where` argument, update it with this data.
     */
    update: XOR<TemplateFormUpdateInput, TemplateFormUncheckedUpdateInput>
  }

  /**
   * TemplateForm delete
   */
  export type TemplateFormDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TemplateForm
     */
    select?: TemplateFormSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TemplateForm
     */
    omit?: TemplateFormOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TemplateFormInclude<ExtArgs> | null
    /**
     * Filter which TemplateForm to delete.
     */
    where: TemplateFormWhereUniqueInput
  }

  /**
   * TemplateForm deleteMany
   */
  export type TemplateFormDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TemplateForms to delete
     */
    where?: TemplateFormWhereInput
    /**
     * Limit how many TemplateForms to delete.
     */
    limit?: number
  }

  /**
   * TemplateForm findRaw
   */
  export type TemplateFormFindRawArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The query predicate filter. If unspecified, then all documents in the collection will match the predicate. ${@link https://docs.mongodb.com/manual/reference/operator/query MongoDB Docs}.
     */
    filter?: InputJsonValue
    /**
     * Additional options to pass to the `find` command ${@link https://docs.mongodb.com/manual/reference/command/find/#command-fields MongoDB Docs}.
     */
    options?: InputJsonValue
  }

  /**
   * TemplateForm aggregateRaw
   */
  export type TemplateFormAggregateRawArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * An array of aggregation stages to process and transform the document stream via the aggregation pipeline. ${@link https://docs.mongodb.com/manual/reference/operator/aggregation-pipeline MongoDB Docs}.
     */
    pipeline?: InputJsonValue[]
    /**
     * Additional options to pass to the `aggregate` command ${@link https://docs.mongodb.com/manual/reference/command/aggregate/#command-fields MongoDB Docs}.
     */
    options?: InputJsonValue
  }

  /**
   * TemplateForm without action
   */
  export type TemplateFormDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TemplateForm
     */
    select?: TemplateFormSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TemplateForm
     */
    omit?: TemplateFormOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TemplateFormInclude<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const UserScalarFieldEnum: {
    id: 'id',
    clerkUserId: 'clerkUserId',
    email: 'email',
    name: 'name',
    emailOtp: 'emailOtp',
    phoneOtp: 'phoneOtp',
    otpExpiry: 'otpExpiry',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    profileImage: 'profileImage',
    role: 'role'
  };

  export type UserScalarFieldEnum = (typeof UserScalarFieldEnum)[keyof typeof UserScalarFieldEnum]


  export const TeacherDataScalarFieldEnum: {
    id: 'id',
    userId: 'userId',
    name: 'name',
    email: 'email',
    school: 'school',
    subject: 'subject',
    experience: 'experience',
    studentCount: 'studentCount',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type TeacherDataScalarFieldEnum = (typeof TeacherDataScalarFieldEnum)[keyof typeof TeacherDataScalarFieldEnum]


  export const StudentDataScalarFieldEnum: {
    id: 'id',
    userId: 'userId',
    name: 'name',
    email: 'email',
    grade: 'grade',
    targetExam: 'targetExam',
    subjects: 'subjects',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type StudentDataScalarFieldEnum = (typeof StudentDataScalarFieldEnum)[keyof typeof StudentDataScalarFieldEnum]


  export const CoachingDataScalarFieldEnum: {
    id: 'id',
    userId: 'userId',
    centerName: 'centerName',
    contactPerson: 'contactPerson',
    email: 'email',
    phone: 'phone',
    location: 'location',
    teacherCount: 'teacherCount',
    studentCount: 'studentCount',
    targetExams: 'targetExams',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type CoachingDataScalarFieldEnum = (typeof CoachingDataScalarFieldEnum)[keyof typeof CoachingDataScalarFieldEnum]


  export const QuestionScalarFieldEnum: {
    id: 'id',
    question_number: 'question_number',
    file_name: 'file_name',
    question_text: 'question_text',
    isQuestionImage: 'isQuestionImage',
    question_image: 'question_image',
    isOptionImage: 'isOptionImage',
    options: 'options',
    option_images: 'option_images',
    section_name: 'section_name',
    question_type: 'question_type',
    topic: 'topic',
    exam_name: 'exam_name',
    subject: 'subject',
    chapter: 'chapter',
    answer: 'answer',
    flagged: 'flagged'
  };

  export type QuestionScalarFieldEnum = (typeof QuestionScalarFieldEnum)[keyof typeof QuestionScalarFieldEnum]


  export const FolderScalarFieldEnum: {
    id: 'id',
    name: 'name',
    userId: 'userId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type FolderScalarFieldEnum = (typeof FolderScalarFieldEnum)[keyof typeof FolderScalarFieldEnum]


  export const FolderQuestionScalarFieldEnum: {
    id: 'id',
    folderId: 'folderId',
    questionId: 'questionId'
  };

  export type FolderQuestionScalarFieldEnum = (typeof FolderQuestionScalarFieldEnum)[keyof typeof FolderQuestionScalarFieldEnum]


  export const TemplateFormScalarFieldEnum: {
    id: 'id',
    userId: 'userId',
    templateName: 'templateName',
    institutionAddress: 'institutionAddress',
    institution: 'institution',
    marks: 'marks',
    time: 'time',
    exam: 'exam',
    subject: 'subject',
    logo: 'logo',
    saveTemplate: 'saveTemplate',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type TemplateFormScalarFieldEnum = (typeof TemplateFormScalarFieldEnum)[keyof typeof TemplateFormScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    
  /**
   * Deep Input Types
   */


  export type UserWhereInput = {
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    id?: StringFilter<"User"> | string
    clerkUserId?: StringFilter<"User"> | string
    email?: StringNullableFilter<"User"> | string | null
    name?: StringNullableFilter<"User"> | string | null
    emailOtp?: StringNullableFilter<"User"> | string | null
    phoneOtp?: StringNullableFilter<"User"> | string | null
    otpExpiry?: DateTimeNullableFilter<"User"> | Date | string | null
    createdAt?: DateTimeFilter<"User"> | Date | string
    updatedAt?: DateTimeFilter<"User"> | Date | string
    profileImage?: StringNullableFilter<"User"> | string | null
    role?: StringFilter<"User"> | string
    drafts?: FolderListRelationFilter
    teacherData?: XOR<TeacherDataNullableScalarRelationFilter, TeacherDataWhereInput> | null
    studentData?: XOR<StudentDataNullableScalarRelationFilter, StudentDataWhereInput> | null
    coachingData?: XOR<CoachingDataNullableScalarRelationFilter, CoachingDataWhereInput> | null
    templateForm?: TemplateFormListRelationFilter
  }

  export type UserOrderByWithRelationInput = {
    id?: SortOrder
    clerkUserId?: SortOrder
    email?: SortOrder
    name?: SortOrder
    emailOtp?: SortOrder
    phoneOtp?: SortOrder
    otpExpiry?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    profileImage?: SortOrder
    role?: SortOrder
    drafts?: FolderOrderByRelationAggregateInput
    teacherData?: TeacherDataOrderByWithRelationInput
    studentData?: StudentDataOrderByWithRelationInput
    coachingData?: CoachingDataOrderByWithRelationInput
    templateForm?: TemplateFormOrderByRelationAggregateInput
  }

  export type UserWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    clerkUserId?: string
    email?: string
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    name?: StringNullableFilter<"User"> | string | null
    emailOtp?: StringNullableFilter<"User"> | string | null
    phoneOtp?: StringNullableFilter<"User"> | string | null
    otpExpiry?: DateTimeNullableFilter<"User"> | Date | string | null
    createdAt?: DateTimeFilter<"User"> | Date | string
    updatedAt?: DateTimeFilter<"User"> | Date | string
    profileImage?: StringNullableFilter<"User"> | string | null
    role?: StringFilter<"User"> | string
    drafts?: FolderListRelationFilter
    teacherData?: XOR<TeacherDataNullableScalarRelationFilter, TeacherDataWhereInput> | null
    studentData?: XOR<StudentDataNullableScalarRelationFilter, StudentDataWhereInput> | null
    coachingData?: XOR<CoachingDataNullableScalarRelationFilter, CoachingDataWhereInput> | null
    templateForm?: TemplateFormListRelationFilter
  }, "id" | "clerkUserId" | "email">

  export type UserOrderByWithAggregationInput = {
    id?: SortOrder
    clerkUserId?: SortOrder
    email?: SortOrder
    name?: SortOrder
    emailOtp?: SortOrder
    phoneOtp?: SortOrder
    otpExpiry?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    profileImage?: SortOrder
    role?: SortOrder
    _count?: UserCountOrderByAggregateInput
    _max?: UserMaxOrderByAggregateInput
    _min?: UserMinOrderByAggregateInput
  }

  export type UserScalarWhereWithAggregatesInput = {
    AND?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    OR?: UserScalarWhereWithAggregatesInput[]
    NOT?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"User"> | string
    clerkUserId?: StringWithAggregatesFilter<"User"> | string
    email?: StringNullableWithAggregatesFilter<"User"> | string | null
    name?: StringNullableWithAggregatesFilter<"User"> | string | null
    emailOtp?: StringNullableWithAggregatesFilter<"User"> | string | null
    phoneOtp?: StringNullableWithAggregatesFilter<"User"> | string | null
    otpExpiry?: DateTimeNullableWithAggregatesFilter<"User"> | Date | string | null
    createdAt?: DateTimeWithAggregatesFilter<"User"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"User"> | Date | string
    profileImage?: StringNullableWithAggregatesFilter<"User"> | string | null
    role?: StringWithAggregatesFilter<"User"> | string
  }

  export type TeacherDataWhereInput = {
    AND?: TeacherDataWhereInput | TeacherDataWhereInput[]
    OR?: TeacherDataWhereInput[]
    NOT?: TeacherDataWhereInput | TeacherDataWhereInput[]
    id?: StringFilter<"TeacherData"> | string
    userId?: StringFilter<"TeacherData"> | string
    name?: StringFilter<"TeacherData"> | string
    email?: StringFilter<"TeacherData"> | string
    school?: StringFilter<"TeacherData"> | string
    subject?: StringFilter<"TeacherData"> | string
    experience?: StringNullableFilter<"TeacherData"> | string | null
    studentCount?: StringNullableFilter<"TeacherData"> | string | null
    createdAt?: DateTimeFilter<"TeacherData"> | Date | string
    updatedAt?: DateTimeFilter<"TeacherData"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }

  export type TeacherDataOrderByWithRelationInput = {
    id?: SortOrder
    userId?: SortOrder
    name?: SortOrder
    email?: SortOrder
    school?: SortOrder
    subject?: SortOrder
    experience?: SortOrder
    studentCount?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    user?: UserOrderByWithRelationInput
  }

  export type TeacherDataWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    userId?: string
    AND?: TeacherDataWhereInput | TeacherDataWhereInput[]
    OR?: TeacherDataWhereInput[]
    NOT?: TeacherDataWhereInput | TeacherDataWhereInput[]
    name?: StringFilter<"TeacherData"> | string
    email?: StringFilter<"TeacherData"> | string
    school?: StringFilter<"TeacherData"> | string
    subject?: StringFilter<"TeacherData"> | string
    experience?: StringNullableFilter<"TeacherData"> | string | null
    studentCount?: StringNullableFilter<"TeacherData"> | string | null
    createdAt?: DateTimeFilter<"TeacherData"> | Date | string
    updatedAt?: DateTimeFilter<"TeacherData"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }, "id" | "userId">

  export type TeacherDataOrderByWithAggregationInput = {
    id?: SortOrder
    userId?: SortOrder
    name?: SortOrder
    email?: SortOrder
    school?: SortOrder
    subject?: SortOrder
    experience?: SortOrder
    studentCount?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: TeacherDataCountOrderByAggregateInput
    _max?: TeacherDataMaxOrderByAggregateInput
    _min?: TeacherDataMinOrderByAggregateInput
  }

  export type TeacherDataScalarWhereWithAggregatesInput = {
    AND?: TeacherDataScalarWhereWithAggregatesInput | TeacherDataScalarWhereWithAggregatesInput[]
    OR?: TeacherDataScalarWhereWithAggregatesInput[]
    NOT?: TeacherDataScalarWhereWithAggregatesInput | TeacherDataScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"TeacherData"> | string
    userId?: StringWithAggregatesFilter<"TeacherData"> | string
    name?: StringWithAggregatesFilter<"TeacherData"> | string
    email?: StringWithAggregatesFilter<"TeacherData"> | string
    school?: StringWithAggregatesFilter<"TeacherData"> | string
    subject?: StringWithAggregatesFilter<"TeacherData"> | string
    experience?: StringNullableWithAggregatesFilter<"TeacherData"> | string | null
    studentCount?: StringNullableWithAggregatesFilter<"TeacherData"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"TeacherData"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"TeacherData"> | Date | string
  }

  export type StudentDataWhereInput = {
    AND?: StudentDataWhereInput | StudentDataWhereInput[]
    OR?: StudentDataWhereInput[]
    NOT?: StudentDataWhereInput | StudentDataWhereInput[]
    id?: StringFilter<"StudentData"> | string
    userId?: StringFilter<"StudentData"> | string
    name?: StringFilter<"StudentData"> | string
    email?: StringFilter<"StudentData"> | string
    grade?: StringFilter<"StudentData"> | string
    targetExam?: StringFilter<"StudentData"> | string
    subjects?: StringNullableListFilter<"StudentData">
    createdAt?: DateTimeFilter<"StudentData"> | Date | string
    updatedAt?: DateTimeFilter<"StudentData"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }

  export type StudentDataOrderByWithRelationInput = {
    id?: SortOrder
    userId?: SortOrder
    name?: SortOrder
    email?: SortOrder
    grade?: SortOrder
    targetExam?: SortOrder
    subjects?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    user?: UserOrderByWithRelationInput
  }

  export type StudentDataWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    userId?: string
    AND?: StudentDataWhereInput | StudentDataWhereInput[]
    OR?: StudentDataWhereInput[]
    NOT?: StudentDataWhereInput | StudentDataWhereInput[]
    name?: StringFilter<"StudentData"> | string
    email?: StringFilter<"StudentData"> | string
    grade?: StringFilter<"StudentData"> | string
    targetExam?: StringFilter<"StudentData"> | string
    subjects?: StringNullableListFilter<"StudentData">
    createdAt?: DateTimeFilter<"StudentData"> | Date | string
    updatedAt?: DateTimeFilter<"StudentData"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }, "id" | "userId">

  export type StudentDataOrderByWithAggregationInput = {
    id?: SortOrder
    userId?: SortOrder
    name?: SortOrder
    email?: SortOrder
    grade?: SortOrder
    targetExam?: SortOrder
    subjects?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: StudentDataCountOrderByAggregateInput
    _max?: StudentDataMaxOrderByAggregateInput
    _min?: StudentDataMinOrderByAggregateInput
  }

  export type StudentDataScalarWhereWithAggregatesInput = {
    AND?: StudentDataScalarWhereWithAggregatesInput | StudentDataScalarWhereWithAggregatesInput[]
    OR?: StudentDataScalarWhereWithAggregatesInput[]
    NOT?: StudentDataScalarWhereWithAggregatesInput | StudentDataScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"StudentData"> | string
    userId?: StringWithAggregatesFilter<"StudentData"> | string
    name?: StringWithAggregatesFilter<"StudentData"> | string
    email?: StringWithAggregatesFilter<"StudentData"> | string
    grade?: StringWithAggregatesFilter<"StudentData"> | string
    targetExam?: StringWithAggregatesFilter<"StudentData"> | string
    subjects?: StringNullableListFilter<"StudentData">
    createdAt?: DateTimeWithAggregatesFilter<"StudentData"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"StudentData"> | Date | string
  }

  export type CoachingDataWhereInput = {
    AND?: CoachingDataWhereInput | CoachingDataWhereInput[]
    OR?: CoachingDataWhereInput[]
    NOT?: CoachingDataWhereInput | CoachingDataWhereInput[]
    id?: StringFilter<"CoachingData"> | string
    userId?: StringFilter<"CoachingData"> | string
    centerName?: StringFilter<"CoachingData"> | string
    contactPerson?: StringFilter<"CoachingData"> | string
    email?: StringFilter<"CoachingData"> | string
    phone?: StringFilter<"CoachingData"> | string
    location?: StringFilter<"CoachingData"> | string
    teacherCount?: StringNullableFilter<"CoachingData"> | string | null
    studentCount?: StringNullableFilter<"CoachingData"> | string | null
    targetExams?: StringNullableListFilter<"CoachingData">
    createdAt?: DateTimeFilter<"CoachingData"> | Date | string
    updatedAt?: DateTimeFilter<"CoachingData"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }

  export type CoachingDataOrderByWithRelationInput = {
    id?: SortOrder
    userId?: SortOrder
    centerName?: SortOrder
    contactPerson?: SortOrder
    email?: SortOrder
    phone?: SortOrder
    location?: SortOrder
    teacherCount?: SortOrder
    studentCount?: SortOrder
    targetExams?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    user?: UserOrderByWithRelationInput
  }

  export type CoachingDataWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    userId?: string
    AND?: CoachingDataWhereInput | CoachingDataWhereInput[]
    OR?: CoachingDataWhereInput[]
    NOT?: CoachingDataWhereInput | CoachingDataWhereInput[]
    centerName?: StringFilter<"CoachingData"> | string
    contactPerson?: StringFilter<"CoachingData"> | string
    email?: StringFilter<"CoachingData"> | string
    phone?: StringFilter<"CoachingData"> | string
    location?: StringFilter<"CoachingData"> | string
    teacherCount?: StringNullableFilter<"CoachingData"> | string | null
    studentCount?: StringNullableFilter<"CoachingData"> | string | null
    targetExams?: StringNullableListFilter<"CoachingData">
    createdAt?: DateTimeFilter<"CoachingData"> | Date | string
    updatedAt?: DateTimeFilter<"CoachingData"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }, "id" | "userId">

  export type CoachingDataOrderByWithAggregationInput = {
    id?: SortOrder
    userId?: SortOrder
    centerName?: SortOrder
    contactPerson?: SortOrder
    email?: SortOrder
    phone?: SortOrder
    location?: SortOrder
    teacherCount?: SortOrder
    studentCount?: SortOrder
    targetExams?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: CoachingDataCountOrderByAggregateInput
    _max?: CoachingDataMaxOrderByAggregateInput
    _min?: CoachingDataMinOrderByAggregateInput
  }

  export type CoachingDataScalarWhereWithAggregatesInput = {
    AND?: CoachingDataScalarWhereWithAggregatesInput | CoachingDataScalarWhereWithAggregatesInput[]
    OR?: CoachingDataScalarWhereWithAggregatesInput[]
    NOT?: CoachingDataScalarWhereWithAggregatesInput | CoachingDataScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"CoachingData"> | string
    userId?: StringWithAggregatesFilter<"CoachingData"> | string
    centerName?: StringWithAggregatesFilter<"CoachingData"> | string
    contactPerson?: StringWithAggregatesFilter<"CoachingData"> | string
    email?: StringWithAggregatesFilter<"CoachingData"> | string
    phone?: StringWithAggregatesFilter<"CoachingData"> | string
    location?: StringWithAggregatesFilter<"CoachingData"> | string
    teacherCount?: StringNullableWithAggregatesFilter<"CoachingData"> | string | null
    studentCount?: StringNullableWithAggregatesFilter<"CoachingData"> | string | null
    targetExams?: StringNullableListFilter<"CoachingData">
    createdAt?: DateTimeWithAggregatesFilter<"CoachingData"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"CoachingData"> | Date | string
  }

  export type QuestionWhereInput = {
    AND?: QuestionWhereInput | QuestionWhereInput[]
    OR?: QuestionWhereInput[]
    NOT?: QuestionWhereInput | QuestionWhereInput[]
    id?: StringFilter<"Question"> | string
    question_number?: IntFilter<"Question"> | number
    file_name?: StringNullableFilter<"Question"> | string | null
    question_text?: StringFilter<"Question"> | string
    isQuestionImage?: BoolFilter<"Question"> | boolean
    question_image?: StringNullableFilter<"Question"> | string | null
    isOptionImage?: BoolFilter<"Question"> | boolean
    options?: StringNullableListFilter<"Question">
    option_images?: StringNullableListFilter<"Question">
    section_name?: StringNullableFilter<"Question"> | string | null
    question_type?: StringNullableFilter<"Question"> | string | null
    topic?: StringNullableFilter<"Question"> | string | null
    exam_name?: StringNullableFilter<"Question"> | string | null
    subject?: StringNullableFilter<"Question"> | string | null
    chapter?: StringNullableFilter<"Question"> | string | null
    answer?: StringNullableFilter<"Question"> | string | null
    flagged?: BoolNullableFilter<"Question"> | boolean | null
    folderRelations?: FolderQuestionListRelationFilter
  }

  export type QuestionOrderByWithRelationInput = {
    id?: SortOrder
    question_number?: SortOrder
    file_name?: SortOrder
    question_text?: SortOrder
    isQuestionImage?: SortOrder
    question_image?: SortOrder
    isOptionImage?: SortOrder
    options?: SortOrder
    option_images?: SortOrder
    section_name?: SortOrder
    question_type?: SortOrder
    topic?: SortOrder
    exam_name?: SortOrder
    subject?: SortOrder
    chapter?: SortOrder
    answer?: SortOrder
    flagged?: SortOrder
    folderRelations?: FolderQuestionOrderByRelationAggregateInput
  }

  export type QuestionWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: QuestionWhereInput | QuestionWhereInput[]
    OR?: QuestionWhereInput[]
    NOT?: QuestionWhereInput | QuestionWhereInput[]
    question_number?: IntFilter<"Question"> | number
    file_name?: StringNullableFilter<"Question"> | string | null
    question_text?: StringFilter<"Question"> | string
    isQuestionImage?: BoolFilter<"Question"> | boolean
    question_image?: StringNullableFilter<"Question"> | string | null
    isOptionImage?: BoolFilter<"Question"> | boolean
    options?: StringNullableListFilter<"Question">
    option_images?: StringNullableListFilter<"Question">
    section_name?: StringNullableFilter<"Question"> | string | null
    question_type?: StringNullableFilter<"Question"> | string | null
    topic?: StringNullableFilter<"Question"> | string | null
    exam_name?: StringNullableFilter<"Question"> | string | null
    subject?: StringNullableFilter<"Question"> | string | null
    chapter?: StringNullableFilter<"Question"> | string | null
    answer?: StringNullableFilter<"Question"> | string | null
    flagged?: BoolNullableFilter<"Question"> | boolean | null
    folderRelations?: FolderQuestionListRelationFilter
  }, "id">

  export type QuestionOrderByWithAggregationInput = {
    id?: SortOrder
    question_number?: SortOrder
    file_name?: SortOrder
    question_text?: SortOrder
    isQuestionImage?: SortOrder
    question_image?: SortOrder
    isOptionImage?: SortOrder
    options?: SortOrder
    option_images?: SortOrder
    section_name?: SortOrder
    question_type?: SortOrder
    topic?: SortOrder
    exam_name?: SortOrder
    subject?: SortOrder
    chapter?: SortOrder
    answer?: SortOrder
    flagged?: SortOrder
    _count?: QuestionCountOrderByAggregateInput
    _avg?: QuestionAvgOrderByAggregateInput
    _max?: QuestionMaxOrderByAggregateInput
    _min?: QuestionMinOrderByAggregateInput
    _sum?: QuestionSumOrderByAggregateInput
  }

  export type QuestionScalarWhereWithAggregatesInput = {
    AND?: QuestionScalarWhereWithAggregatesInput | QuestionScalarWhereWithAggregatesInput[]
    OR?: QuestionScalarWhereWithAggregatesInput[]
    NOT?: QuestionScalarWhereWithAggregatesInput | QuestionScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Question"> | string
    question_number?: IntWithAggregatesFilter<"Question"> | number
    file_name?: StringNullableWithAggregatesFilter<"Question"> | string | null
    question_text?: StringWithAggregatesFilter<"Question"> | string
    isQuestionImage?: BoolWithAggregatesFilter<"Question"> | boolean
    question_image?: StringNullableWithAggregatesFilter<"Question"> | string | null
    isOptionImage?: BoolWithAggregatesFilter<"Question"> | boolean
    options?: StringNullableListFilter<"Question">
    option_images?: StringNullableListFilter<"Question">
    section_name?: StringNullableWithAggregatesFilter<"Question"> | string | null
    question_type?: StringNullableWithAggregatesFilter<"Question"> | string | null
    topic?: StringNullableWithAggregatesFilter<"Question"> | string | null
    exam_name?: StringNullableWithAggregatesFilter<"Question"> | string | null
    subject?: StringNullableWithAggregatesFilter<"Question"> | string | null
    chapter?: StringNullableWithAggregatesFilter<"Question"> | string | null
    answer?: StringNullableWithAggregatesFilter<"Question"> | string | null
    flagged?: BoolNullableWithAggregatesFilter<"Question"> | boolean | null
  }

  export type FolderWhereInput = {
    AND?: FolderWhereInput | FolderWhereInput[]
    OR?: FolderWhereInput[]
    NOT?: FolderWhereInput | FolderWhereInput[]
    id?: StringFilter<"Folder"> | string
    name?: StringFilter<"Folder"> | string
    userId?: StringFilter<"Folder"> | string
    createdAt?: DateTimeFilter<"Folder"> | Date | string
    updatedAt?: DateTimeFilter<"Folder"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
    questionRelations?: FolderQuestionListRelationFilter
  }

  export type FolderOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    userId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    user?: UserOrderByWithRelationInput
    questionRelations?: FolderQuestionOrderByRelationAggregateInput
  }

  export type FolderWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: FolderWhereInput | FolderWhereInput[]
    OR?: FolderWhereInput[]
    NOT?: FolderWhereInput | FolderWhereInput[]
    name?: StringFilter<"Folder"> | string
    userId?: StringFilter<"Folder"> | string
    createdAt?: DateTimeFilter<"Folder"> | Date | string
    updatedAt?: DateTimeFilter<"Folder"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
    questionRelations?: FolderQuestionListRelationFilter
  }, "id">

  export type FolderOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    userId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: FolderCountOrderByAggregateInput
    _max?: FolderMaxOrderByAggregateInput
    _min?: FolderMinOrderByAggregateInput
  }

  export type FolderScalarWhereWithAggregatesInput = {
    AND?: FolderScalarWhereWithAggregatesInput | FolderScalarWhereWithAggregatesInput[]
    OR?: FolderScalarWhereWithAggregatesInput[]
    NOT?: FolderScalarWhereWithAggregatesInput | FolderScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Folder"> | string
    name?: StringWithAggregatesFilter<"Folder"> | string
    userId?: StringWithAggregatesFilter<"Folder"> | string
    createdAt?: DateTimeWithAggregatesFilter<"Folder"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Folder"> | Date | string
  }

  export type FolderQuestionWhereInput = {
    AND?: FolderQuestionWhereInput | FolderQuestionWhereInput[]
    OR?: FolderQuestionWhereInput[]
    NOT?: FolderQuestionWhereInput | FolderQuestionWhereInput[]
    id?: StringFilter<"FolderQuestion"> | string
    folderId?: StringFilter<"FolderQuestion"> | string
    questionId?: StringFilter<"FolderQuestion"> | string
    folder?: XOR<FolderScalarRelationFilter, FolderWhereInput>
    question?: XOR<QuestionScalarRelationFilter, QuestionWhereInput>
  }

  export type FolderQuestionOrderByWithRelationInput = {
    id?: SortOrder
    folderId?: SortOrder
    questionId?: SortOrder
    folder?: FolderOrderByWithRelationInput
    question?: QuestionOrderByWithRelationInput
  }

  export type FolderQuestionWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: FolderQuestionWhereInput | FolderQuestionWhereInput[]
    OR?: FolderQuestionWhereInput[]
    NOT?: FolderQuestionWhereInput | FolderQuestionWhereInput[]
    folderId?: StringFilter<"FolderQuestion"> | string
    questionId?: StringFilter<"FolderQuestion"> | string
    folder?: XOR<FolderScalarRelationFilter, FolderWhereInput>
    question?: XOR<QuestionScalarRelationFilter, QuestionWhereInput>
  }, "id">

  export type FolderQuestionOrderByWithAggregationInput = {
    id?: SortOrder
    folderId?: SortOrder
    questionId?: SortOrder
    _count?: FolderQuestionCountOrderByAggregateInput
    _max?: FolderQuestionMaxOrderByAggregateInput
    _min?: FolderQuestionMinOrderByAggregateInput
  }

  export type FolderQuestionScalarWhereWithAggregatesInput = {
    AND?: FolderQuestionScalarWhereWithAggregatesInput | FolderQuestionScalarWhereWithAggregatesInput[]
    OR?: FolderQuestionScalarWhereWithAggregatesInput[]
    NOT?: FolderQuestionScalarWhereWithAggregatesInput | FolderQuestionScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"FolderQuestion"> | string
    folderId?: StringWithAggregatesFilter<"FolderQuestion"> | string
    questionId?: StringWithAggregatesFilter<"FolderQuestion"> | string
  }

  export type TemplateFormWhereInput = {
    AND?: TemplateFormWhereInput | TemplateFormWhereInput[]
    OR?: TemplateFormWhereInput[]
    NOT?: TemplateFormWhereInput | TemplateFormWhereInput[]
    id?: StringFilter<"TemplateForm"> | string
    userId?: StringFilter<"TemplateForm"> | string
    templateName?: StringFilter<"TemplateForm"> | string
    institutionAddress?: StringNullableFilter<"TemplateForm"> | string | null
    institution?: StringNullableFilter<"TemplateForm"> | string | null
    marks?: StringNullableFilter<"TemplateForm"> | string | null
    time?: StringNullableFilter<"TemplateForm"> | string | null
    exam?: StringNullableFilter<"TemplateForm"> | string | null
    subject?: StringNullableFilter<"TemplateForm"> | string | null
    logo?: StringNullableFilter<"TemplateForm"> | string | null
    saveTemplate?: BoolFilter<"TemplateForm"> | boolean
    createdAt?: DateTimeFilter<"TemplateForm"> | Date | string
    updatedAt?: DateTimeFilter<"TemplateForm"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }

  export type TemplateFormOrderByWithRelationInput = {
    id?: SortOrder
    userId?: SortOrder
    templateName?: SortOrder
    institutionAddress?: SortOrder
    institution?: SortOrder
    marks?: SortOrder
    time?: SortOrder
    exam?: SortOrder
    subject?: SortOrder
    logo?: SortOrder
    saveTemplate?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    user?: UserOrderByWithRelationInput
  }

  export type TemplateFormWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: TemplateFormWhereInput | TemplateFormWhereInput[]
    OR?: TemplateFormWhereInput[]
    NOT?: TemplateFormWhereInput | TemplateFormWhereInput[]
    userId?: StringFilter<"TemplateForm"> | string
    templateName?: StringFilter<"TemplateForm"> | string
    institutionAddress?: StringNullableFilter<"TemplateForm"> | string | null
    institution?: StringNullableFilter<"TemplateForm"> | string | null
    marks?: StringNullableFilter<"TemplateForm"> | string | null
    time?: StringNullableFilter<"TemplateForm"> | string | null
    exam?: StringNullableFilter<"TemplateForm"> | string | null
    subject?: StringNullableFilter<"TemplateForm"> | string | null
    logo?: StringNullableFilter<"TemplateForm"> | string | null
    saveTemplate?: BoolFilter<"TemplateForm"> | boolean
    createdAt?: DateTimeFilter<"TemplateForm"> | Date | string
    updatedAt?: DateTimeFilter<"TemplateForm"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }, "id">

  export type TemplateFormOrderByWithAggregationInput = {
    id?: SortOrder
    userId?: SortOrder
    templateName?: SortOrder
    institutionAddress?: SortOrder
    institution?: SortOrder
    marks?: SortOrder
    time?: SortOrder
    exam?: SortOrder
    subject?: SortOrder
    logo?: SortOrder
    saveTemplate?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: TemplateFormCountOrderByAggregateInput
    _max?: TemplateFormMaxOrderByAggregateInput
    _min?: TemplateFormMinOrderByAggregateInput
  }

  export type TemplateFormScalarWhereWithAggregatesInput = {
    AND?: TemplateFormScalarWhereWithAggregatesInput | TemplateFormScalarWhereWithAggregatesInput[]
    OR?: TemplateFormScalarWhereWithAggregatesInput[]
    NOT?: TemplateFormScalarWhereWithAggregatesInput | TemplateFormScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"TemplateForm"> | string
    userId?: StringWithAggregatesFilter<"TemplateForm"> | string
    templateName?: StringWithAggregatesFilter<"TemplateForm"> | string
    institutionAddress?: StringNullableWithAggregatesFilter<"TemplateForm"> | string | null
    institution?: StringNullableWithAggregatesFilter<"TemplateForm"> | string | null
    marks?: StringNullableWithAggregatesFilter<"TemplateForm"> | string | null
    time?: StringNullableWithAggregatesFilter<"TemplateForm"> | string | null
    exam?: StringNullableWithAggregatesFilter<"TemplateForm"> | string | null
    subject?: StringNullableWithAggregatesFilter<"TemplateForm"> | string | null
    logo?: StringNullableWithAggregatesFilter<"TemplateForm"> | string | null
    saveTemplate?: BoolWithAggregatesFilter<"TemplateForm"> | boolean
    createdAt?: DateTimeWithAggregatesFilter<"TemplateForm"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"TemplateForm"> | Date | string
  }

  export type UserCreateInput = {
    id?: string
    clerkUserId: string
    email?: string | null
    name?: string | null
    emailOtp?: string | null
    phoneOtp?: string | null
    otpExpiry?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    profileImage?: string | null
    role: string
    drafts?: FolderCreateNestedManyWithoutUserInput
    teacherData?: TeacherDataCreateNestedOneWithoutUserInput
    studentData?: StudentDataCreateNestedOneWithoutUserInput
    coachingData?: CoachingDataCreateNestedOneWithoutUserInput
    templateForm?: TemplateFormCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateInput = {
    id?: string
    clerkUserId: string
    email?: string | null
    name?: string | null
    emailOtp?: string | null
    phoneOtp?: string | null
    otpExpiry?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    profileImage?: string | null
    role: string
    drafts?: FolderUncheckedCreateNestedManyWithoutUserInput
    teacherData?: TeacherDataUncheckedCreateNestedOneWithoutUserInput
    studentData?: StudentDataUncheckedCreateNestedOneWithoutUserInput
    coachingData?: CoachingDataUncheckedCreateNestedOneWithoutUserInput
    templateForm?: TemplateFormUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserUpdateInput = {
    clerkUserId?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    name?: NullableStringFieldUpdateOperationsInput | string | null
    emailOtp?: NullableStringFieldUpdateOperationsInput | string | null
    phoneOtp?: NullableStringFieldUpdateOperationsInput | string | null
    otpExpiry?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    profileImage?: NullableStringFieldUpdateOperationsInput | string | null
    role?: StringFieldUpdateOperationsInput | string
    drafts?: FolderUpdateManyWithoutUserNestedInput
    teacherData?: TeacherDataUpdateOneWithoutUserNestedInput
    studentData?: StudentDataUpdateOneWithoutUserNestedInput
    coachingData?: CoachingDataUpdateOneWithoutUserNestedInput
    templateForm?: TemplateFormUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateInput = {
    clerkUserId?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    name?: NullableStringFieldUpdateOperationsInput | string | null
    emailOtp?: NullableStringFieldUpdateOperationsInput | string | null
    phoneOtp?: NullableStringFieldUpdateOperationsInput | string | null
    otpExpiry?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    profileImage?: NullableStringFieldUpdateOperationsInput | string | null
    role?: StringFieldUpdateOperationsInput | string
    drafts?: FolderUncheckedUpdateManyWithoutUserNestedInput
    teacherData?: TeacherDataUncheckedUpdateOneWithoutUserNestedInput
    studentData?: StudentDataUncheckedUpdateOneWithoutUserNestedInput
    coachingData?: CoachingDataUncheckedUpdateOneWithoutUserNestedInput
    templateForm?: TemplateFormUncheckedUpdateManyWithoutUserNestedInput
  }

  export type UserCreateManyInput = {
    id?: string
    clerkUserId: string
    email?: string | null
    name?: string | null
    emailOtp?: string | null
    phoneOtp?: string | null
    otpExpiry?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    profileImage?: string | null
    role: string
  }

  export type UserUpdateManyMutationInput = {
    clerkUserId?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    name?: NullableStringFieldUpdateOperationsInput | string | null
    emailOtp?: NullableStringFieldUpdateOperationsInput | string | null
    phoneOtp?: NullableStringFieldUpdateOperationsInput | string | null
    otpExpiry?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    profileImage?: NullableStringFieldUpdateOperationsInput | string | null
    role?: StringFieldUpdateOperationsInput | string
  }

  export type UserUncheckedUpdateManyInput = {
    clerkUserId?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    name?: NullableStringFieldUpdateOperationsInput | string | null
    emailOtp?: NullableStringFieldUpdateOperationsInput | string | null
    phoneOtp?: NullableStringFieldUpdateOperationsInput | string | null
    otpExpiry?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    profileImage?: NullableStringFieldUpdateOperationsInput | string | null
    role?: StringFieldUpdateOperationsInput | string
  }

  export type TeacherDataCreateInput = {
    id?: string
    name: string
    email: string
    school: string
    subject: string
    experience?: string | null
    studentCount?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    user: UserCreateNestedOneWithoutTeacherDataInput
  }

  export type TeacherDataUncheckedCreateInput = {
    id?: string
    userId: string
    name: string
    email: string
    school: string
    subject: string
    experience?: string | null
    studentCount?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TeacherDataUpdateInput = {
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    school?: StringFieldUpdateOperationsInput | string
    subject?: StringFieldUpdateOperationsInput | string
    experience?: NullableStringFieldUpdateOperationsInput | string | null
    studentCount?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutTeacherDataNestedInput
  }

  export type TeacherDataUncheckedUpdateInput = {
    userId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    school?: StringFieldUpdateOperationsInput | string
    subject?: StringFieldUpdateOperationsInput | string
    experience?: NullableStringFieldUpdateOperationsInput | string | null
    studentCount?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TeacherDataCreateManyInput = {
    id?: string
    userId: string
    name: string
    email: string
    school: string
    subject: string
    experience?: string | null
    studentCount?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TeacherDataUpdateManyMutationInput = {
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    school?: StringFieldUpdateOperationsInput | string
    subject?: StringFieldUpdateOperationsInput | string
    experience?: NullableStringFieldUpdateOperationsInput | string | null
    studentCount?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TeacherDataUncheckedUpdateManyInput = {
    userId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    school?: StringFieldUpdateOperationsInput | string
    subject?: StringFieldUpdateOperationsInput | string
    experience?: NullableStringFieldUpdateOperationsInput | string | null
    studentCount?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StudentDataCreateInput = {
    id?: string
    name: string
    email: string
    grade: string
    targetExam: string
    subjects?: StudentDataCreatesubjectsInput | string[]
    createdAt?: Date | string
    updatedAt?: Date | string
    user: UserCreateNestedOneWithoutStudentDataInput
  }

  export type StudentDataUncheckedCreateInput = {
    id?: string
    userId: string
    name: string
    email: string
    grade: string
    targetExam: string
    subjects?: StudentDataCreatesubjectsInput | string[]
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type StudentDataUpdateInput = {
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    grade?: StringFieldUpdateOperationsInput | string
    targetExam?: StringFieldUpdateOperationsInput | string
    subjects?: StudentDataUpdatesubjectsInput | string[]
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutStudentDataNestedInput
  }

  export type StudentDataUncheckedUpdateInput = {
    userId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    grade?: StringFieldUpdateOperationsInput | string
    targetExam?: StringFieldUpdateOperationsInput | string
    subjects?: StudentDataUpdatesubjectsInput | string[]
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StudentDataCreateManyInput = {
    id?: string
    userId: string
    name: string
    email: string
    grade: string
    targetExam: string
    subjects?: StudentDataCreatesubjectsInput | string[]
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type StudentDataUpdateManyMutationInput = {
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    grade?: StringFieldUpdateOperationsInput | string
    targetExam?: StringFieldUpdateOperationsInput | string
    subjects?: StudentDataUpdatesubjectsInput | string[]
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StudentDataUncheckedUpdateManyInput = {
    userId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    grade?: StringFieldUpdateOperationsInput | string
    targetExam?: StringFieldUpdateOperationsInput | string
    subjects?: StudentDataUpdatesubjectsInput | string[]
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CoachingDataCreateInput = {
    id?: string
    centerName: string
    contactPerson: string
    email: string
    phone: string
    location: string
    teacherCount?: string | null
    studentCount?: string | null
    targetExams?: CoachingDataCreatetargetExamsInput | string[]
    createdAt?: Date | string
    updatedAt?: Date | string
    user: UserCreateNestedOneWithoutCoachingDataInput
  }

  export type CoachingDataUncheckedCreateInput = {
    id?: string
    userId: string
    centerName: string
    contactPerson: string
    email: string
    phone: string
    location: string
    teacherCount?: string | null
    studentCount?: string | null
    targetExams?: CoachingDataCreatetargetExamsInput | string[]
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CoachingDataUpdateInput = {
    centerName?: StringFieldUpdateOperationsInput | string
    contactPerson?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    phone?: StringFieldUpdateOperationsInput | string
    location?: StringFieldUpdateOperationsInput | string
    teacherCount?: NullableStringFieldUpdateOperationsInput | string | null
    studentCount?: NullableStringFieldUpdateOperationsInput | string | null
    targetExams?: CoachingDataUpdatetargetExamsInput | string[]
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutCoachingDataNestedInput
  }

  export type CoachingDataUncheckedUpdateInput = {
    userId?: StringFieldUpdateOperationsInput | string
    centerName?: StringFieldUpdateOperationsInput | string
    contactPerson?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    phone?: StringFieldUpdateOperationsInput | string
    location?: StringFieldUpdateOperationsInput | string
    teacherCount?: NullableStringFieldUpdateOperationsInput | string | null
    studentCount?: NullableStringFieldUpdateOperationsInput | string | null
    targetExams?: CoachingDataUpdatetargetExamsInput | string[]
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CoachingDataCreateManyInput = {
    id?: string
    userId: string
    centerName: string
    contactPerson: string
    email: string
    phone: string
    location: string
    teacherCount?: string | null
    studentCount?: string | null
    targetExams?: CoachingDataCreatetargetExamsInput | string[]
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CoachingDataUpdateManyMutationInput = {
    centerName?: StringFieldUpdateOperationsInput | string
    contactPerson?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    phone?: StringFieldUpdateOperationsInput | string
    location?: StringFieldUpdateOperationsInput | string
    teacherCount?: NullableStringFieldUpdateOperationsInput | string | null
    studentCount?: NullableStringFieldUpdateOperationsInput | string | null
    targetExams?: CoachingDataUpdatetargetExamsInput | string[]
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CoachingDataUncheckedUpdateManyInput = {
    userId?: StringFieldUpdateOperationsInput | string
    centerName?: StringFieldUpdateOperationsInput | string
    contactPerson?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    phone?: StringFieldUpdateOperationsInput | string
    location?: StringFieldUpdateOperationsInput | string
    teacherCount?: NullableStringFieldUpdateOperationsInput | string | null
    studentCount?: NullableStringFieldUpdateOperationsInput | string | null
    targetExams?: CoachingDataUpdatetargetExamsInput | string[]
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type QuestionCreateInput = {
    id?: string
    question_number: number
    file_name?: string | null
    question_text: string
    isQuestionImage?: boolean
    question_image?: string | null
    isOptionImage?: boolean
    options?: QuestionCreateoptionsInput | string[]
    option_images?: QuestionCreateoption_imagesInput | string[]
    section_name?: string | null
    question_type?: string | null
    topic?: string | null
    exam_name?: string | null
    subject?: string | null
    chapter?: string | null
    answer?: string | null
    flagged?: boolean | null
    folderRelations?: FolderQuestionCreateNestedManyWithoutQuestionInput
  }

  export type QuestionUncheckedCreateInput = {
    id?: string
    question_number: number
    file_name?: string | null
    question_text: string
    isQuestionImage?: boolean
    question_image?: string | null
    isOptionImage?: boolean
    options?: QuestionCreateoptionsInput | string[]
    option_images?: QuestionCreateoption_imagesInput | string[]
    section_name?: string | null
    question_type?: string | null
    topic?: string | null
    exam_name?: string | null
    subject?: string | null
    chapter?: string | null
    answer?: string | null
    flagged?: boolean | null
    folderRelations?: FolderQuestionUncheckedCreateNestedManyWithoutQuestionInput
  }

  export type QuestionUpdateInput = {
    question_number?: IntFieldUpdateOperationsInput | number
    file_name?: NullableStringFieldUpdateOperationsInput | string | null
    question_text?: StringFieldUpdateOperationsInput | string
    isQuestionImage?: BoolFieldUpdateOperationsInput | boolean
    question_image?: NullableStringFieldUpdateOperationsInput | string | null
    isOptionImage?: BoolFieldUpdateOperationsInput | boolean
    options?: QuestionUpdateoptionsInput | string[]
    option_images?: QuestionUpdateoption_imagesInput | string[]
    section_name?: NullableStringFieldUpdateOperationsInput | string | null
    question_type?: NullableStringFieldUpdateOperationsInput | string | null
    topic?: NullableStringFieldUpdateOperationsInput | string | null
    exam_name?: NullableStringFieldUpdateOperationsInput | string | null
    subject?: NullableStringFieldUpdateOperationsInput | string | null
    chapter?: NullableStringFieldUpdateOperationsInput | string | null
    answer?: NullableStringFieldUpdateOperationsInput | string | null
    flagged?: NullableBoolFieldUpdateOperationsInput | boolean | null
    folderRelations?: FolderQuestionUpdateManyWithoutQuestionNestedInput
  }

  export type QuestionUncheckedUpdateInput = {
    question_number?: IntFieldUpdateOperationsInput | number
    file_name?: NullableStringFieldUpdateOperationsInput | string | null
    question_text?: StringFieldUpdateOperationsInput | string
    isQuestionImage?: BoolFieldUpdateOperationsInput | boolean
    question_image?: NullableStringFieldUpdateOperationsInput | string | null
    isOptionImage?: BoolFieldUpdateOperationsInput | boolean
    options?: QuestionUpdateoptionsInput | string[]
    option_images?: QuestionUpdateoption_imagesInput | string[]
    section_name?: NullableStringFieldUpdateOperationsInput | string | null
    question_type?: NullableStringFieldUpdateOperationsInput | string | null
    topic?: NullableStringFieldUpdateOperationsInput | string | null
    exam_name?: NullableStringFieldUpdateOperationsInput | string | null
    subject?: NullableStringFieldUpdateOperationsInput | string | null
    chapter?: NullableStringFieldUpdateOperationsInput | string | null
    answer?: NullableStringFieldUpdateOperationsInput | string | null
    flagged?: NullableBoolFieldUpdateOperationsInput | boolean | null
    folderRelations?: FolderQuestionUncheckedUpdateManyWithoutQuestionNestedInput
  }

  export type QuestionCreateManyInput = {
    id?: string
    question_number: number
    file_name?: string | null
    question_text: string
    isQuestionImage?: boolean
    question_image?: string | null
    isOptionImage?: boolean
    options?: QuestionCreateoptionsInput | string[]
    option_images?: QuestionCreateoption_imagesInput | string[]
    section_name?: string | null
    question_type?: string | null
    topic?: string | null
    exam_name?: string | null
    subject?: string | null
    chapter?: string | null
    answer?: string | null
    flagged?: boolean | null
  }

  export type QuestionUpdateManyMutationInput = {
    question_number?: IntFieldUpdateOperationsInput | number
    file_name?: NullableStringFieldUpdateOperationsInput | string | null
    question_text?: StringFieldUpdateOperationsInput | string
    isQuestionImage?: BoolFieldUpdateOperationsInput | boolean
    question_image?: NullableStringFieldUpdateOperationsInput | string | null
    isOptionImage?: BoolFieldUpdateOperationsInput | boolean
    options?: QuestionUpdateoptionsInput | string[]
    option_images?: QuestionUpdateoption_imagesInput | string[]
    section_name?: NullableStringFieldUpdateOperationsInput | string | null
    question_type?: NullableStringFieldUpdateOperationsInput | string | null
    topic?: NullableStringFieldUpdateOperationsInput | string | null
    exam_name?: NullableStringFieldUpdateOperationsInput | string | null
    subject?: NullableStringFieldUpdateOperationsInput | string | null
    chapter?: NullableStringFieldUpdateOperationsInput | string | null
    answer?: NullableStringFieldUpdateOperationsInput | string | null
    flagged?: NullableBoolFieldUpdateOperationsInput | boolean | null
  }

  export type QuestionUncheckedUpdateManyInput = {
    question_number?: IntFieldUpdateOperationsInput | number
    file_name?: NullableStringFieldUpdateOperationsInput | string | null
    question_text?: StringFieldUpdateOperationsInput | string
    isQuestionImage?: BoolFieldUpdateOperationsInput | boolean
    question_image?: NullableStringFieldUpdateOperationsInput | string | null
    isOptionImage?: BoolFieldUpdateOperationsInput | boolean
    options?: QuestionUpdateoptionsInput | string[]
    option_images?: QuestionUpdateoption_imagesInput | string[]
    section_name?: NullableStringFieldUpdateOperationsInput | string | null
    question_type?: NullableStringFieldUpdateOperationsInput | string | null
    topic?: NullableStringFieldUpdateOperationsInput | string | null
    exam_name?: NullableStringFieldUpdateOperationsInput | string | null
    subject?: NullableStringFieldUpdateOperationsInput | string | null
    chapter?: NullableStringFieldUpdateOperationsInput | string | null
    answer?: NullableStringFieldUpdateOperationsInput | string | null
    flagged?: NullableBoolFieldUpdateOperationsInput | boolean | null
  }

  export type FolderCreateInput = {
    id?: string
    name: string
    createdAt?: Date | string
    updatedAt?: Date | string
    user: UserCreateNestedOneWithoutDraftsInput
    questionRelations?: FolderQuestionCreateNestedManyWithoutFolderInput
  }

  export type FolderUncheckedCreateInput = {
    id?: string
    name: string
    userId: string
    createdAt?: Date | string
    updatedAt?: Date | string
    questionRelations?: FolderQuestionUncheckedCreateNestedManyWithoutFolderInput
  }

  export type FolderUpdateInput = {
    name?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutDraftsNestedInput
    questionRelations?: FolderQuestionUpdateManyWithoutFolderNestedInput
  }

  export type FolderUncheckedUpdateInput = {
    name?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    questionRelations?: FolderQuestionUncheckedUpdateManyWithoutFolderNestedInput
  }

  export type FolderCreateManyInput = {
    id?: string
    name: string
    userId: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type FolderUpdateManyMutationInput = {
    name?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type FolderUncheckedUpdateManyInput = {
    name?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type FolderQuestionCreateInput = {
    id?: string
    folder: FolderCreateNestedOneWithoutQuestionRelationsInput
    question: QuestionCreateNestedOneWithoutFolderRelationsInput
  }

  export type FolderQuestionUncheckedCreateInput = {
    id?: string
    folderId: string
    questionId: string
  }

  export type FolderQuestionUpdateInput = {
    folder?: FolderUpdateOneRequiredWithoutQuestionRelationsNestedInput
    question?: QuestionUpdateOneRequiredWithoutFolderRelationsNestedInput
  }

  export type FolderQuestionUncheckedUpdateInput = {
    folderId?: StringFieldUpdateOperationsInput | string
    questionId?: StringFieldUpdateOperationsInput | string
  }

  export type FolderQuestionCreateManyInput = {
    id?: string
    folderId: string
    questionId: string
  }

  export type FolderQuestionUpdateManyMutationInput = {

  }

  export type FolderQuestionUncheckedUpdateManyInput = {
    folderId?: StringFieldUpdateOperationsInput | string
    questionId?: StringFieldUpdateOperationsInput | string
  }

  export type TemplateFormCreateInput = {
    id?: string
    templateName: string
    institutionAddress?: string | null
    institution?: string | null
    marks?: string | null
    time?: string | null
    exam?: string | null
    subject?: string | null
    logo?: string | null
    saveTemplate: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    user: UserCreateNestedOneWithoutTemplateFormInput
  }

  export type TemplateFormUncheckedCreateInput = {
    id?: string
    userId: string
    templateName: string
    institutionAddress?: string | null
    institution?: string | null
    marks?: string | null
    time?: string | null
    exam?: string | null
    subject?: string | null
    logo?: string | null
    saveTemplate: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TemplateFormUpdateInput = {
    templateName?: StringFieldUpdateOperationsInput | string
    institutionAddress?: NullableStringFieldUpdateOperationsInput | string | null
    institution?: NullableStringFieldUpdateOperationsInput | string | null
    marks?: NullableStringFieldUpdateOperationsInput | string | null
    time?: NullableStringFieldUpdateOperationsInput | string | null
    exam?: NullableStringFieldUpdateOperationsInput | string | null
    subject?: NullableStringFieldUpdateOperationsInput | string | null
    logo?: NullableStringFieldUpdateOperationsInput | string | null
    saveTemplate?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutTemplateFormNestedInput
  }

  export type TemplateFormUncheckedUpdateInput = {
    userId?: StringFieldUpdateOperationsInput | string
    templateName?: StringFieldUpdateOperationsInput | string
    institutionAddress?: NullableStringFieldUpdateOperationsInput | string | null
    institution?: NullableStringFieldUpdateOperationsInput | string | null
    marks?: NullableStringFieldUpdateOperationsInput | string | null
    time?: NullableStringFieldUpdateOperationsInput | string | null
    exam?: NullableStringFieldUpdateOperationsInput | string | null
    subject?: NullableStringFieldUpdateOperationsInput | string | null
    logo?: NullableStringFieldUpdateOperationsInput | string | null
    saveTemplate?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TemplateFormCreateManyInput = {
    id?: string
    userId: string
    templateName: string
    institutionAddress?: string | null
    institution?: string | null
    marks?: string | null
    time?: string | null
    exam?: string | null
    subject?: string | null
    logo?: string | null
    saveTemplate: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TemplateFormUpdateManyMutationInput = {
    templateName?: StringFieldUpdateOperationsInput | string
    institutionAddress?: NullableStringFieldUpdateOperationsInput | string | null
    institution?: NullableStringFieldUpdateOperationsInput | string | null
    marks?: NullableStringFieldUpdateOperationsInput | string | null
    time?: NullableStringFieldUpdateOperationsInput | string | null
    exam?: NullableStringFieldUpdateOperationsInput | string | null
    subject?: NullableStringFieldUpdateOperationsInput | string | null
    logo?: NullableStringFieldUpdateOperationsInput | string | null
    saveTemplate?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TemplateFormUncheckedUpdateManyInput = {
    userId?: StringFieldUpdateOperationsInput | string
    templateName?: StringFieldUpdateOperationsInput | string
    institutionAddress?: NullableStringFieldUpdateOperationsInput | string | null
    institution?: NullableStringFieldUpdateOperationsInput | string | null
    marks?: NullableStringFieldUpdateOperationsInput | string | null
    time?: NullableStringFieldUpdateOperationsInput | string | null
    exam?: NullableStringFieldUpdateOperationsInput | string | null
    subject?: NullableStringFieldUpdateOperationsInput | string | null
    logo?: NullableStringFieldUpdateOperationsInput | string | null
    saveTemplate?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
    isSet?: boolean
  }

  export type DateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
    isSet?: boolean
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type FolderListRelationFilter = {
    every?: FolderWhereInput
    some?: FolderWhereInput
    none?: FolderWhereInput
  }

  export type TeacherDataNullableScalarRelationFilter = {
    is?: TeacherDataWhereInput | null
    isNot?: TeacherDataWhereInput | null
  }

  export type StudentDataNullableScalarRelationFilter = {
    is?: StudentDataWhereInput | null
    isNot?: StudentDataWhereInput | null
  }

  export type CoachingDataNullableScalarRelationFilter = {
    is?: CoachingDataWhereInput | null
    isNot?: CoachingDataWhereInput | null
  }

  export type TemplateFormListRelationFilter = {
    every?: TemplateFormWhereInput
    some?: TemplateFormWhereInput
    none?: TemplateFormWhereInput
  }

  export type FolderOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type TemplateFormOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type UserCountOrderByAggregateInput = {
    id?: SortOrder
    clerkUserId?: SortOrder
    email?: SortOrder
    name?: SortOrder
    emailOtp?: SortOrder
    phoneOtp?: SortOrder
    otpExpiry?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    profileImage?: SortOrder
    role?: SortOrder
  }

  export type UserMaxOrderByAggregateInput = {
    id?: SortOrder
    clerkUserId?: SortOrder
    email?: SortOrder
    name?: SortOrder
    emailOtp?: SortOrder
    phoneOtp?: SortOrder
    otpExpiry?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    profileImage?: SortOrder
    role?: SortOrder
  }

  export type UserMinOrderByAggregateInput = {
    id?: SortOrder
    clerkUserId?: SortOrder
    email?: SortOrder
    name?: SortOrder
    emailOtp?: SortOrder
    phoneOtp?: SortOrder
    otpExpiry?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    profileImage?: SortOrder
    role?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
    isSet?: boolean
  }

  export type DateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
    isSet?: boolean
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type UserScalarRelationFilter = {
    is?: UserWhereInput
    isNot?: UserWhereInput
  }

  export type TeacherDataCountOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    name?: SortOrder
    email?: SortOrder
    school?: SortOrder
    subject?: SortOrder
    experience?: SortOrder
    studentCount?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type TeacherDataMaxOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    name?: SortOrder
    email?: SortOrder
    school?: SortOrder
    subject?: SortOrder
    experience?: SortOrder
    studentCount?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type TeacherDataMinOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    name?: SortOrder
    email?: SortOrder
    school?: SortOrder
    subject?: SortOrder
    experience?: SortOrder
    studentCount?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type StringNullableListFilter<$PrismaModel = never> = {
    equals?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    has?: string | StringFieldRefInput<$PrismaModel> | null
    hasEvery?: string[] | ListStringFieldRefInput<$PrismaModel>
    hasSome?: string[] | ListStringFieldRefInput<$PrismaModel>
    isEmpty?: boolean
  }

  export type StudentDataCountOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    name?: SortOrder
    email?: SortOrder
    grade?: SortOrder
    targetExam?: SortOrder
    subjects?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type StudentDataMaxOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    name?: SortOrder
    email?: SortOrder
    grade?: SortOrder
    targetExam?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type StudentDataMinOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    name?: SortOrder
    email?: SortOrder
    grade?: SortOrder
    targetExam?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CoachingDataCountOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    centerName?: SortOrder
    contactPerson?: SortOrder
    email?: SortOrder
    phone?: SortOrder
    location?: SortOrder
    teacherCount?: SortOrder
    studentCount?: SortOrder
    targetExams?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CoachingDataMaxOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    centerName?: SortOrder
    contactPerson?: SortOrder
    email?: SortOrder
    phone?: SortOrder
    location?: SortOrder
    teacherCount?: SortOrder
    studentCount?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CoachingDataMinOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    centerName?: SortOrder
    contactPerson?: SortOrder
    email?: SortOrder
    phone?: SortOrder
    location?: SortOrder
    teacherCount?: SortOrder
    studentCount?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type BoolNullableFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel> | null
    not?: NestedBoolNullableFilter<$PrismaModel> | boolean | null
    isSet?: boolean
  }

  export type FolderQuestionListRelationFilter = {
    every?: FolderQuestionWhereInput
    some?: FolderQuestionWhereInput
    none?: FolderQuestionWhereInput
  }

  export type FolderQuestionOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type QuestionCountOrderByAggregateInput = {
    id?: SortOrder
    question_number?: SortOrder
    file_name?: SortOrder
    question_text?: SortOrder
    isQuestionImage?: SortOrder
    question_image?: SortOrder
    isOptionImage?: SortOrder
    options?: SortOrder
    option_images?: SortOrder
    section_name?: SortOrder
    question_type?: SortOrder
    topic?: SortOrder
    exam_name?: SortOrder
    subject?: SortOrder
    chapter?: SortOrder
    answer?: SortOrder
    flagged?: SortOrder
  }

  export type QuestionAvgOrderByAggregateInput = {
    question_number?: SortOrder
  }

  export type QuestionMaxOrderByAggregateInput = {
    id?: SortOrder
    question_number?: SortOrder
    file_name?: SortOrder
    question_text?: SortOrder
    isQuestionImage?: SortOrder
    question_image?: SortOrder
    isOptionImage?: SortOrder
    section_name?: SortOrder
    question_type?: SortOrder
    topic?: SortOrder
    exam_name?: SortOrder
    subject?: SortOrder
    chapter?: SortOrder
    answer?: SortOrder
    flagged?: SortOrder
  }

  export type QuestionMinOrderByAggregateInput = {
    id?: SortOrder
    question_number?: SortOrder
    file_name?: SortOrder
    question_text?: SortOrder
    isQuestionImage?: SortOrder
    question_image?: SortOrder
    isOptionImage?: SortOrder
    section_name?: SortOrder
    question_type?: SortOrder
    topic?: SortOrder
    exam_name?: SortOrder
    subject?: SortOrder
    chapter?: SortOrder
    answer?: SortOrder
    flagged?: SortOrder
  }

  export type QuestionSumOrderByAggregateInput = {
    question_number?: SortOrder
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type BoolNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel> | null
    not?: NestedBoolNullableWithAggregatesFilter<$PrismaModel> | boolean | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedBoolNullableFilter<$PrismaModel>
    _max?: NestedBoolNullableFilter<$PrismaModel>
    isSet?: boolean
  }

  export type FolderCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    userId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type FolderMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    userId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type FolderMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    userId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type FolderScalarRelationFilter = {
    is?: FolderWhereInput
    isNot?: FolderWhereInput
  }

  export type QuestionScalarRelationFilter = {
    is?: QuestionWhereInput
    isNot?: QuestionWhereInput
  }

  export type FolderQuestionCountOrderByAggregateInput = {
    id?: SortOrder
    folderId?: SortOrder
    questionId?: SortOrder
  }

  export type FolderQuestionMaxOrderByAggregateInput = {
    id?: SortOrder
    folderId?: SortOrder
    questionId?: SortOrder
  }

  export type FolderQuestionMinOrderByAggregateInput = {
    id?: SortOrder
    folderId?: SortOrder
    questionId?: SortOrder
  }

  export type TemplateFormCountOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    templateName?: SortOrder
    institutionAddress?: SortOrder
    institution?: SortOrder
    marks?: SortOrder
    time?: SortOrder
    exam?: SortOrder
    subject?: SortOrder
    logo?: SortOrder
    saveTemplate?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type TemplateFormMaxOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    templateName?: SortOrder
    institutionAddress?: SortOrder
    institution?: SortOrder
    marks?: SortOrder
    time?: SortOrder
    exam?: SortOrder
    subject?: SortOrder
    logo?: SortOrder
    saveTemplate?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type TemplateFormMinOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    templateName?: SortOrder
    institutionAddress?: SortOrder
    institution?: SortOrder
    marks?: SortOrder
    time?: SortOrder
    exam?: SortOrder
    subject?: SortOrder
    logo?: SortOrder
    saveTemplate?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type FolderCreateNestedManyWithoutUserInput = {
    create?: XOR<FolderCreateWithoutUserInput, FolderUncheckedCreateWithoutUserInput> | FolderCreateWithoutUserInput[] | FolderUncheckedCreateWithoutUserInput[]
    connectOrCreate?: FolderCreateOrConnectWithoutUserInput | FolderCreateOrConnectWithoutUserInput[]
    createMany?: FolderCreateManyUserInputEnvelope
    connect?: FolderWhereUniqueInput | FolderWhereUniqueInput[]
  }

  export type TeacherDataCreateNestedOneWithoutUserInput = {
    create?: XOR<TeacherDataCreateWithoutUserInput, TeacherDataUncheckedCreateWithoutUserInput>
    connectOrCreate?: TeacherDataCreateOrConnectWithoutUserInput
    connect?: TeacherDataWhereUniqueInput
  }

  export type StudentDataCreateNestedOneWithoutUserInput = {
    create?: XOR<StudentDataCreateWithoutUserInput, StudentDataUncheckedCreateWithoutUserInput>
    connectOrCreate?: StudentDataCreateOrConnectWithoutUserInput
    connect?: StudentDataWhereUniqueInput
  }

  export type CoachingDataCreateNestedOneWithoutUserInput = {
    create?: XOR<CoachingDataCreateWithoutUserInput, CoachingDataUncheckedCreateWithoutUserInput>
    connectOrCreate?: CoachingDataCreateOrConnectWithoutUserInput
    connect?: CoachingDataWhereUniqueInput
  }

  export type TemplateFormCreateNestedManyWithoutUserInput = {
    create?: XOR<TemplateFormCreateWithoutUserInput, TemplateFormUncheckedCreateWithoutUserInput> | TemplateFormCreateWithoutUserInput[] | TemplateFormUncheckedCreateWithoutUserInput[]
    connectOrCreate?: TemplateFormCreateOrConnectWithoutUserInput | TemplateFormCreateOrConnectWithoutUserInput[]
    createMany?: TemplateFormCreateManyUserInputEnvelope
    connect?: TemplateFormWhereUniqueInput | TemplateFormWhereUniqueInput[]
  }

  export type FolderUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<FolderCreateWithoutUserInput, FolderUncheckedCreateWithoutUserInput> | FolderCreateWithoutUserInput[] | FolderUncheckedCreateWithoutUserInput[]
    connectOrCreate?: FolderCreateOrConnectWithoutUserInput | FolderCreateOrConnectWithoutUserInput[]
    createMany?: FolderCreateManyUserInputEnvelope
    connect?: FolderWhereUniqueInput | FolderWhereUniqueInput[]
  }

  export type TeacherDataUncheckedCreateNestedOneWithoutUserInput = {
    create?: XOR<TeacherDataCreateWithoutUserInput, TeacherDataUncheckedCreateWithoutUserInput>
    connectOrCreate?: TeacherDataCreateOrConnectWithoutUserInput
    connect?: TeacherDataWhereUniqueInput
  }

  export type StudentDataUncheckedCreateNestedOneWithoutUserInput = {
    create?: XOR<StudentDataCreateWithoutUserInput, StudentDataUncheckedCreateWithoutUserInput>
    connectOrCreate?: StudentDataCreateOrConnectWithoutUserInput
    connect?: StudentDataWhereUniqueInput
  }

  export type CoachingDataUncheckedCreateNestedOneWithoutUserInput = {
    create?: XOR<CoachingDataCreateWithoutUserInput, CoachingDataUncheckedCreateWithoutUserInput>
    connectOrCreate?: CoachingDataCreateOrConnectWithoutUserInput
    connect?: CoachingDataWhereUniqueInput
  }

  export type TemplateFormUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<TemplateFormCreateWithoutUserInput, TemplateFormUncheckedCreateWithoutUserInput> | TemplateFormCreateWithoutUserInput[] | TemplateFormUncheckedCreateWithoutUserInput[]
    connectOrCreate?: TemplateFormCreateOrConnectWithoutUserInput | TemplateFormCreateOrConnectWithoutUserInput[]
    createMany?: TemplateFormCreateManyUserInputEnvelope
    connect?: TemplateFormWhereUniqueInput | TemplateFormWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
    unset?: boolean
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
    unset?: boolean
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type FolderUpdateManyWithoutUserNestedInput = {
    create?: XOR<FolderCreateWithoutUserInput, FolderUncheckedCreateWithoutUserInput> | FolderCreateWithoutUserInput[] | FolderUncheckedCreateWithoutUserInput[]
    connectOrCreate?: FolderCreateOrConnectWithoutUserInput | FolderCreateOrConnectWithoutUserInput[]
    upsert?: FolderUpsertWithWhereUniqueWithoutUserInput | FolderUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: FolderCreateManyUserInputEnvelope
    set?: FolderWhereUniqueInput | FolderWhereUniqueInput[]
    disconnect?: FolderWhereUniqueInput | FolderWhereUniqueInput[]
    delete?: FolderWhereUniqueInput | FolderWhereUniqueInput[]
    connect?: FolderWhereUniqueInput | FolderWhereUniqueInput[]
    update?: FolderUpdateWithWhereUniqueWithoutUserInput | FolderUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: FolderUpdateManyWithWhereWithoutUserInput | FolderUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: FolderScalarWhereInput | FolderScalarWhereInput[]
  }

  export type TeacherDataUpdateOneWithoutUserNestedInput = {
    create?: XOR<TeacherDataCreateWithoutUserInput, TeacherDataUncheckedCreateWithoutUserInput>
    connectOrCreate?: TeacherDataCreateOrConnectWithoutUserInput
    upsert?: TeacherDataUpsertWithoutUserInput
    disconnect?: TeacherDataWhereInput | boolean
    delete?: TeacherDataWhereInput | boolean
    connect?: TeacherDataWhereUniqueInput
    update?: XOR<XOR<TeacherDataUpdateToOneWithWhereWithoutUserInput, TeacherDataUpdateWithoutUserInput>, TeacherDataUncheckedUpdateWithoutUserInput>
  }

  export type StudentDataUpdateOneWithoutUserNestedInput = {
    create?: XOR<StudentDataCreateWithoutUserInput, StudentDataUncheckedCreateWithoutUserInput>
    connectOrCreate?: StudentDataCreateOrConnectWithoutUserInput
    upsert?: StudentDataUpsertWithoutUserInput
    disconnect?: StudentDataWhereInput | boolean
    delete?: StudentDataWhereInput | boolean
    connect?: StudentDataWhereUniqueInput
    update?: XOR<XOR<StudentDataUpdateToOneWithWhereWithoutUserInput, StudentDataUpdateWithoutUserInput>, StudentDataUncheckedUpdateWithoutUserInput>
  }

  export type CoachingDataUpdateOneWithoutUserNestedInput = {
    create?: XOR<CoachingDataCreateWithoutUserInput, CoachingDataUncheckedCreateWithoutUserInput>
    connectOrCreate?: CoachingDataCreateOrConnectWithoutUserInput
    upsert?: CoachingDataUpsertWithoutUserInput
    disconnect?: CoachingDataWhereInput | boolean
    delete?: CoachingDataWhereInput | boolean
    connect?: CoachingDataWhereUniqueInput
    update?: XOR<XOR<CoachingDataUpdateToOneWithWhereWithoutUserInput, CoachingDataUpdateWithoutUserInput>, CoachingDataUncheckedUpdateWithoutUserInput>
  }

  export type TemplateFormUpdateManyWithoutUserNestedInput = {
    create?: XOR<TemplateFormCreateWithoutUserInput, TemplateFormUncheckedCreateWithoutUserInput> | TemplateFormCreateWithoutUserInput[] | TemplateFormUncheckedCreateWithoutUserInput[]
    connectOrCreate?: TemplateFormCreateOrConnectWithoutUserInput | TemplateFormCreateOrConnectWithoutUserInput[]
    upsert?: TemplateFormUpsertWithWhereUniqueWithoutUserInput | TemplateFormUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: TemplateFormCreateManyUserInputEnvelope
    set?: TemplateFormWhereUniqueInput | TemplateFormWhereUniqueInput[]
    disconnect?: TemplateFormWhereUniqueInput | TemplateFormWhereUniqueInput[]
    delete?: TemplateFormWhereUniqueInput | TemplateFormWhereUniqueInput[]
    connect?: TemplateFormWhereUniqueInput | TemplateFormWhereUniqueInput[]
    update?: TemplateFormUpdateWithWhereUniqueWithoutUserInput | TemplateFormUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: TemplateFormUpdateManyWithWhereWithoutUserInput | TemplateFormUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: TemplateFormScalarWhereInput | TemplateFormScalarWhereInput[]
  }

  export type FolderUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<FolderCreateWithoutUserInput, FolderUncheckedCreateWithoutUserInput> | FolderCreateWithoutUserInput[] | FolderUncheckedCreateWithoutUserInput[]
    connectOrCreate?: FolderCreateOrConnectWithoutUserInput | FolderCreateOrConnectWithoutUserInput[]
    upsert?: FolderUpsertWithWhereUniqueWithoutUserInput | FolderUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: FolderCreateManyUserInputEnvelope
    set?: FolderWhereUniqueInput | FolderWhereUniqueInput[]
    disconnect?: FolderWhereUniqueInput | FolderWhereUniqueInput[]
    delete?: FolderWhereUniqueInput | FolderWhereUniqueInput[]
    connect?: FolderWhereUniqueInput | FolderWhereUniqueInput[]
    update?: FolderUpdateWithWhereUniqueWithoutUserInput | FolderUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: FolderUpdateManyWithWhereWithoutUserInput | FolderUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: FolderScalarWhereInput | FolderScalarWhereInput[]
  }

  export type TeacherDataUncheckedUpdateOneWithoutUserNestedInput = {
    create?: XOR<TeacherDataCreateWithoutUserInput, TeacherDataUncheckedCreateWithoutUserInput>
    connectOrCreate?: TeacherDataCreateOrConnectWithoutUserInput
    upsert?: TeacherDataUpsertWithoutUserInput
    disconnect?: TeacherDataWhereInput | boolean
    delete?: TeacherDataWhereInput | boolean
    connect?: TeacherDataWhereUniqueInput
    update?: XOR<XOR<TeacherDataUpdateToOneWithWhereWithoutUserInput, TeacherDataUpdateWithoutUserInput>, TeacherDataUncheckedUpdateWithoutUserInput>
  }

  export type StudentDataUncheckedUpdateOneWithoutUserNestedInput = {
    create?: XOR<StudentDataCreateWithoutUserInput, StudentDataUncheckedCreateWithoutUserInput>
    connectOrCreate?: StudentDataCreateOrConnectWithoutUserInput
    upsert?: StudentDataUpsertWithoutUserInput
    disconnect?: StudentDataWhereInput | boolean
    delete?: StudentDataWhereInput | boolean
    connect?: StudentDataWhereUniqueInput
    update?: XOR<XOR<StudentDataUpdateToOneWithWhereWithoutUserInput, StudentDataUpdateWithoutUserInput>, StudentDataUncheckedUpdateWithoutUserInput>
  }

  export type CoachingDataUncheckedUpdateOneWithoutUserNestedInput = {
    create?: XOR<CoachingDataCreateWithoutUserInput, CoachingDataUncheckedCreateWithoutUserInput>
    connectOrCreate?: CoachingDataCreateOrConnectWithoutUserInput
    upsert?: CoachingDataUpsertWithoutUserInput
    disconnect?: CoachingDataWhereInput | boolean
    delete?: CoachingDataWhereInput | boolean
    connect?: CoachingDataWhereUniqueInput
    update?: XOR<XOR<CoachingDataUpdateToOneWithWhereWithoutUserInput, CoachingDataUpdateWithoutUserInput>, CoachingDataUncheckedUpdateWithoutUserInput>
  }

  export type TemplateFormUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<TemplateFormCreateWithoutUserInput, TemplateFormUncheckedCreateWithoutUserInput> | TemplateFormCreateWithoutUserInput[] | TemplateFormUncheckedCreateWithoutUserInput[]
    connectOrCreate?: TemplateFormCreateOrConnectWithoutUserInput | TemplateFormCreateOrConnectWithoutUserInput[]
    upsert?: TemplateFormUpsertWithWhereUniqueWithoutUserInput | TemplateFormUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: TemplateFormCreateManyUserInputEnvelope
    set?: TemplateFormWhereUniqueInput | TemplateFormWhereUniqueInput[]
    disconnect?: TemplateFormWhereUniqueInput | TemplateFormWhereUniqueInput[]
    delete?: TemplateFormWhereUniqueInput | TemplateFormWhereUniqueInput[]
    connect?: TemplateFormWhereUniqueInput | TemplateFormWhereUniqueInput[]
    update?: TemplateFormUpdateWithWhereUniqueWithoutUserInput | TemplateFormUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: TemplateFormUpdateManyWithWhereWithoutUserInput | TemplateFormUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: TemplateFormScalarWhereInput | TemplateFormScalarWhereInput[]
  }

  export type UserCreateNestedOneWithoutTeacherDataInput = {
    create?: XOR<UserCreateWithoutTeacherDataInput, UserUncheckedCreateWithoutTeacherDataInput>
    connectOrCreate?: UserCreateOrConnectWithoutTeacherDataInput
    connect?: UserWhereUniqueInput
  }

  export type UserUpdateOneRequiredWithoutTeacherDataNestedInput = {
    create?: XOR<UserCreateWithoutTeacherDataInput, UserUncheckedCreateWithoutTeacherDataInput>
    connectOrCreate?: UserCreateOrConnectWithoutTeacherDataInput
    upsert?: UserUpsertWithoutTeacherDataInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutTeacherDataInput, UserUpdateWithoutTeacherDataInput>, UserUncheckedUpdateWithoutTeacherDataInput>
  }

  export type StudentDataCreatesubjectsInput = {
    set: string[]
  }

  export type UserCreateNestedOneWithoutStudentDataInput = {
    create?: XOR<UserCreateWithoutStudentDataInput, UserUncheckedCreateWithoutStudentDataInput>
    connectOrCreate?: UserCreateOrConnectWithoutStudentDataInput
    connect?: UserWhereUniqueInput
  }

  export type StudentDataUpdatesubjectsInput = {
    set?: string[]
    push?: string | string[]
  }

  export type UserUpdateOneRequiredWithoutStudentDataNestedInput = {
    create?: XOR<UserCreateWithoutStudentDataInput, UserUncheckedCreateWithoutStudentDataInput>
    connectOrCreate?: UserCreateOrConnectWithoutStudentDataInput
    upsert?: UserUpsertWithoutStudentDataInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutStudentDataInput, UserUpdateWithoutStudentDataInput>, UserUncheckedUpdateWithoutStudentDataInput>
  }

  export type CoachingDataCreatetargetExamsInput = {
    set: string[]
  }

  export type UserCreateNestedOneWithoutCoachingDataInput = {
    create?: XOR<UserCreateWithoutCoachingDataInput, UserUncheckedCreateWithoutCoachingDataInput>
    connectOrCreate?: UserCreateOrConnectWithoutCoachingDataInput
    connect?: UserWhereUniqueInput
  }

  export type CoachingDataUpdatetargetExamsInput = {
    set?: string[]
    push?: string | string[]
  }

  export type UserUpdateOneRequiredWithoutCoachingDataNestedInput = {
    create?: XOR<UserCreateWithoutCoachingDataInput, UserUncheckedCreateWithoutCoachingDataInput>
    connectOrCreate?: UserCreateOrConnectWithoutCoachingDataInput
    upsert?: UserUpsertWithoutCoachingDataInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutCoachingDataInput, UserUpdateWithoutCoachingDataInput>, UserUncheckedUpdateWithoutCoachingDataInput>
  }

  export type QuestionCreateoptionsInput = {
    set: string[]
  }

  export type QuestionCreateoption_imagesInput = {
    set: string[]
  }

  export type FolderQuestionCreateNestedManyWithoutQuestionInput = {
    create?: XOR<FolderQuestionCreateWithoutQuestionInput, FolderQuestionUncheckedCreateWithoutQuestionInput> | FolderQuestionCreateWithoutQuestionInput[] | FolderQuestionUncheckedCreateWithoutQuestionInput[]
    connectOrCreate?: FolderQuestionCreateOrConnectWithoutQuestionInput | FolderQuestionCreateOrConnectWithoutQuestionInput[]
    createMany?: FolderQuestionCreateManyQuestionInputEnvelope
    connect?: FolderQuestionWhereUniqueInput | FolderQuestionWhereUniqueInput[]
  }

  export type FolderQuestionUncheckedCreateNestedManyWithoutQuestionInput = {
    create?: XOR<FolderQuestionCreateWithoutQuestionInput, FolderQuestionUncheckedCreateWithoutQuestionInput> | FolderQuestionCreateWithoutQuestionInput[] | FolderQuestionUncheckedCreateWithoutQuestionInput[]
    connectOrCreate?: FolderQuestionCreateOrConnectWithoutQuestionInput | FolderQuestionCreateOrConnectWithoutQuestionInput[]
    createMany?: FolderQuestionCreateManyQuestionInputEnvelope
    connect?: FolderQuestionWhereUniqueInput | FolderQuestionWhereUniqueInput[]
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type QuestionUpdateoptionsInput = {
    set?: string[]
    push?: string | string[]
  }

  export type QuestionUpdateoption_imagesInput = {
    set?: string[]
    push?: string | string[]
  }

  export type NullableBoolFieldUpdateOperationsInput = {
    set?: boolean | null
    unset?: boolean
  }

  export type FolderQuestionUpdateManyWithoutQuestionNestedInput = {
    create?: XOR<FolderQuestionCreateWithoutQuestionInput, FolderQuestionUncheckedCreateWithoutQuestionInput> | FolderQuestionCreateWithoutQuestionInput[] | FolderQuestionUncheckedCreateWithoutQuestionInput[]
    connectOrCreate?: FolderQuestionCreateOrConnectWithoutQuestionInput | FolderQuestionCreateOrConnectWithoutQuestionInput[]
    upsert?: FolderQuestionUpsertWithWhereUniqueWithoutQuestionInput | FolderQuestionUpsertWithWhereUniqueWithoutQuestionInput[]
    createMany?: FolderQuestionCreateManyQuestionInputEnvelope
    set?: FolderQuestionWhereUniqueInput | FolderQuestionWhereUniqueInput[]
    disconnect?: FolderQuestionWhereUniqueInput | FolderQuestionWhereUniqueInput[]
    delete?: FolderQuestionWhereUniqueInput | FolderQuestionWhereUniqueInput[]
    connect?: FolderQuestionWhereUniqueInput | FolderQuestionWhereUniqueInput[]
    update?: FolderQuestionUpdateWithWhereUniqueWithoutQuestionInput | FolderQuestionUpdateWithWhereUniqueWithoutQuestionInput[]
    updateMany?: FolderQuestionUpdateManyWithWhereWithoutQuestionInput | FolderQuestionUpdateManyWithWhereWithoutQuestionInput[]
    deleteMany?: FolderQuestionScalarWhereInput | FolderQuestionScalarWhereInput[]
  }

  export type FolderQuestionUncheckedUpdateManyWithoutQuestionNestedInput = {
    create?: XOR<FolderQuestionCreateWithoutQuestionInput, FolderQuestionUncheckedCreateWithoutQuestionInput> | FolderQuestionCreateWithoutQuestionInput[] | FolderQuestionUncheckedCreateWithoutQuestionInput[]
    connectOrCreate?: FolderQuestionCreateOrConnectWithoutQuestionInput | FolderQuestionCreateOrConnectWithoutQuestionInput[]
    upsert?: FolderQuestionUpsertWithWhereUniqueWithoutQuestionInput | FolderQuestionUpsertWithWhereUniqueWithoutQuestionInput[]
    createMany?: FolderQuestionCreateManyQuestionInputEnvelope
    set?: FolderQuestionWhereUniqueInput | FolderQuestionWhereUniqueInput[]
    disconnect?: FolderQuestionWhereUniqueInput | FolderQuestionWhereUniqueInput[]
    delete?: FolderQuestionWhereUniqueInput | FolderQuestionWhereUniqueInput[]
    connect?: FolderQuestionWhereUniqueInput | FolderQuestionWhereUniqueInput[]
    update?: FolderQuestionUpdateWithWhereUniqueWithoutQuestionInput | FolderQuestionUpdateWithWhereUniqueWithoutQuestionInput[]
    updateMany?: FolderQuestionUpdateManyWithWhereWithoutQuestionInput | FolderQuestionUpdateManyWithWhereWithoutQuestionInput[]
    deleteMany?: FolderQuestionScalarWhereInput | FolderQuestionScalarWhereInput[]
  }

  export type UserCreateNestedOneWithoutDraftsInput = {
    create?: XOR<UserCreateWithoutDraftsInput, UserUncheckedCreateWithoutDraftsInput>
    connectOrCreate?: UserCreateOrConnectWithoutDraftsInput
    connect?: UserWhereUniqueInput
  }

  export type FolderQuestionCreateNestedManyWithoutFolderInput = {
    create?: XOR<FolderQuestionCreateWithoutFolderInput, FolderQuestionUncheckedCreateWithoutFolderInput> | FolderQuestionCreateWithoutFolderInput[] | FolderQuestionUncheckedCreateWithoutFolderInput[]
    connectOrCreate?: FolderQuestionCreateOrConnectWithoutFolderInput | FolderQuestionCreateOrConnectWithoutFolderInput[]
    createMany?: FolderQuestionCreateManyFolderInputEnvelope
    connect?: FolderQuestionWhereUniqueInput | FolderQuestionWhereUniqueInput[]
  }

  export type FolderQuestionUncheckedCreateNestedManyWithoutFolderInput = {
    create?: XOR<FolderQuestionCreateWithoutFolderInput, FolderQuestionUncheckedCreateWithoutFolderInput> | FolderQuestionCreateWithoutFolderInput[] | FolderQuestionUncheckedCreateWithoutFolderInput[]
    connectOrCreate?: FolderQuestionCreateOrConnectWithoutFolderInput | FolderQuestionCreateOrConnectWithoutFolderInput[]
    createMany?: FolderQuestionCreateManyFolderInputEnvelope
    connect?: FolderQuestionWhereUniqueInput | FolderQuestionWhereUniqueInput[]
  }

  export type UserUpdateOneRequiredWithoutDraftsNestedInput = {
    create?: XOR<UserCreateWithoutDraftsInput, UserUncheckedCreateWithoutDraftsInput>
    connectOrCreate?: UserCreateOrConnectWithoutDraftsInput
    upsert?: UserUpsertWithoutDraftsInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutDraftsInput, UserUpdateWithoutDraftsInput>, UserUncheckedUpdateWithoutDraftsInput>
  }

  export type FolderQuestionUpdateManyWithoutFolderNestedInput = {
    create?: XOR<FolderQuestionCreateWithoutFolderInput, FolderQuestionUncheckedCreateWithoutFolderInput> | FolderQuestionCreateWithoutFolderInput[] | FolderQuestionUncheckedCreateWithoutFolderInput[]
    connectOrCreate?: FolderQuestionCreateOrConnectWithoutFolderInput | FolderQuestionCreateOrConnectWithoutFolderInput[]
    upsert?: FolderQuestionUpsertWithWhereUniqueWithoutFolderInput | FolderQuestionUpsertWithWhereUniqueWithoutFolderInput[]
    createMany?: FolderQuestionCreateManyFolderInputEnvelope
    set?: FolderQuestionWhereUniqueInput | FolderQuestionWhereUniqueInput[]
    disconnect?: FolderQuestionWhereUniqueInput | FolderQuestionWhereUniqueInput[]
    delete?: FolderQuestionWhereUniqueInput | FolderQuestionWhereUniqueInput[]
    connect?: FolderQuestionWhereUniqueInput | FolderQuestionWhereUniqueInput[]
    update?: FolderQuestionUpdateWithWhereUniqueWithoutFolderInput | FolderQuestionUpdateWithWhereUniqueWithoutFolderInput[]
    updateMany?: FolderQuestionUpdateManyWithWhereWithoutFolderInput | FolderQuestionUpdateManyWithWhereWithoutFolderInput[]
    deleteMany?: FolderQuestionScalarWhereInput | FolderQuestionScalarWhereInput[]
  }

  export type FolderQuestionUncheckedUpdateManyWithoutFolderNestedInput = {
    create?: XOR<FolderQuestionCreateWithoutFolderInput, FolderQuestionUncheckedCreateWithoutFolderInput> | FolderQuestionCreateWithoutFolderInput[] | FolderQuestionUncheckedCreateWithoutFolderInput[]
    connectOrCreate?: FolderQuestionCreateOrConnectWithoutFolderInput | FolderQuestionCreateOrConnectWithoutFolderInput[]
    upsert?: FolderQuestionUpsertWithWhereUniqueWithoutFolderInput | FolderQuestionUpsertWithWhereUniqueWithoutFolderInput[]
    createMany?: FolderQuestionCreateManyFolderInputEnvelope
    set?: FolderQuestionWhereUniqueInput | FolderQuestionWhereUniqueInput[]
    disconnect?: FolderQuestionWhereUniqueInput | FolderQuestionWhereUniqueInput[]
    delete?: FolderQuestionWhereUniqueInput | FolderQuestionWhereUniqueInput[]
    connect?: FolderQuestionWhereUniqueInput | FolderQuestionWhereUniqueInput[]
    update?: FolderQuestionUpdateWithWhereUniqueWithoutFolderInput | FolderQuestionUpdateWithWhereUniqueWithoutFolderInput[]
    updateMany?: FolderQuestionUpdateManyWithWhereWithoutFolderInput | FolderQuestionUpdateManyWithWhereWithoutFolderInput[]
    deleteMany?: FolderQuestionScalarWhereInput | FolderQuestionScalarWhereInput[]
  }

  export type FolderCreateNestedOneWithoutQuestionRelationsInput = {
    create?: XOR<FolderCreateWithoutQuestionRelationsInput, FolderUncheckedCreateWithoutQuestionRelationsInput>
    connectOrCreate?: FolderCreateOrConnectWithoutQuestionRelationsInput
    connect?: FolderWhereUniqueInput
  }

  export type QuestionCreateNestedOneWithoutFolderRelationsInput = {
    create?: XOR<QuestionCreateWithoutFolderRelationsInput, QuestionUncheckedCreateWithoutFolderRelationsInput>
    connectOrCreate?: QuestionCreateOrConnectWithoutFolderRelationsInput
    connect?: QuestionWhereUniqueInput
  }

  export type FolderUpdateOneRequiredWithoutQuestionRelationsNestedInput = {
    create?: XOR<FolderCreateWithoutQuestionRelationsInput, FolderUncheckedCreateWithoutQuestionRelationsInput>
    connectOrCreate?: FolderCreateOrConnectWithoutQuestionRelationsInput
    upsert?: FolderUpsertWithoutQuestionRelationsInput
    connect?: FolderWhereUniqueInput
    update?: XOR<XOR<FolderUpdateToOneWithWhereWithoutQuestionRelationsInput, FolderUpdateWithoutQuestionRelationsInput>, FolderUncheckedUpdateWithoutQuestionRelationsInput>
  }

  export type QuestionUpdateOneRequiredWithoutFolderRelationsNestedInput = {
    create?: XOR<QuestionCreateWithoutFolderRelationsInput, QuestionUncheckedCreateWithoutFolderRelationsInput>
    connectOrCreate?: QuestionCreateOrConnectWithoutFolderRelationsInput
    upsert?: QuestionUpsertWithoutFolderRelationsInput
    connect?: QuestionWhereUniqueInput
    update?: XOR<XOR<QuestionUpdateToOneWithWhereWithoutFolderRelationsInput, QuestionUpdateWithoutFolderRelationsInput>, QuestionUncheckedUpdateWithoutFolderRelationsInput>
  }

  export type UserCreateNestedOneWithoutTemplateFormInput = {
    create?: XOR<UserCreateWithoutTemplateFormInput, UserUncheckedCreateWithoutTemplateFormInput>
    connectOrCreate?: UserCreateOrConnectWithoutTemplateFormInput
    connect?: UserWhereUniqueInput
  }

  export type UserUpdateOneRequiredWithoutTemplateFormNestedInput = {
    create?: XOR<UserCreateWithoutTemplateFormInput, UserUncheckedCreateWithoutTemplateFormInput>
    connectOrCreate?: UserCreateOrConnectWithoutTemplateFormInput
    upsert?: UserUpsertWithoutTemplateFormInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutTemplateFormInput, UserUpdateWithoutTemplateFormInput>, UserUncheckedUpdateWithoutTemplateFormInput>
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
    isSet?: boolean
  }

  export type NestedDateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
    isSet?: boolean
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
    isSet?: boolean
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
    isSet?: boolean
  }

  export type NestedDateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
    isSet?: boolean
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedBoolNullableFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel> | null
    not?: NestedBoolNullableFilter<$PrismaModel> | boolean | null
    isSet?: boolean
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type NestedBoolNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel> | null
    not?: NestedBoolNullableWithAggregatesFilter<$PrismaModel> | boolean | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedBoolNullableFilter<$PrismaModel>
    _max?: NestedBoolNullableFilter<$PrismaModel>
    isSet?: boolean
  }

  export type FolderCreateWithoutUserInput = {
    id?: string
    name: string
    createdAt?: Date | string
    updatedAt?: Date | string
    questionRelations?: FolderQuestionCreateNestedManyWithoutFolderInput
  }

  export type FolderUncheckedCreateWithoutUserInput = {
    id?: string
    name: string
    createdAt?: Date | string
    updatedAt?: Date | string
    questionRelations?: FolderQuestionUncheckedCreateNestedManyWithoutFolderInput
  }

  export type FolderCreateOrConnectWithoutUserInput = {
    where: FolderWhereUniqueInput
    create: XOR<FolderCreateWithoutUserInput, FolderUncheckedCreateWithoutUserInput>
  }

  export type FolderCreateManyUserInputEnvelope = {
    data: FolderCreateManyUserInput | FolderCreateManyUserInput[]
  }

  export type TeacherDataCreateWithoutUserInput = {
    id?: string
    name: string
    email: string
    school: string
    subject: string
    experience?: string | null
    studentCount?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TeacherDataUncheckedCreateWithoutUserInput = {
    id?: string
    name: string
    email: string
    school: string
    subject: string
    experience?: string | null
    studentCount?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TeacherDataCreateOrConnectWithoutUserInput = {
    where: TeacherDataWhereUniqueInput
    create: XOR<TeacherDataCreateWithoutUserInput, TeacherDataUncheckedCreateWithoutUserInput>
  }

  export type StudentDataCreateWithoutUserInput = {
    id?: string
    name: string
    email: string
    grade: string
    targetExam: string
    subjects?: StudentDataCreatesubjectsInput | string[]
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type StudentDataUncheckedCreateWithoutUserInput = {
    id?: string
    name: string
    email: string
    grade: string
    targetExam: string
    subjects?: StudentDataCreatesubjectsInput | string[]
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type StudentDataCreateOrConnectWithoutUserInput = {
    where: StudentDataWhereUniqueInput
    create: XOR<StudentDataCreateWithoutUserInput, StudentDataUncheckedCreateWithoutUserInput>
  }

  export type CoachingDataCreateWithoutUserInput = {
    id?: string
    centerName: string
    contactPerson: string
    email: string
    phone: string
    location: string
    teacherCount?: string | null
    studentCount?: string | null
    targetExams?: CoachingDataCreatetargetExamsInput | string[]
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CoachingDataUncheckedCreateWithoutUserInput = {
    id?: string
    centerName: string
    contactPerson: string
    email: string
    phone: string
    location: string
    teacherCount?: string | null
    studentCount?: string | null
    targetExams?: CoachingDataCreatetargetExamsInput | string[]
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CoachingDataCreateOrConnectWithoutUserInput = {
    where: CoachingDataWhereUniqueInput
    create: XOR<CoachingDataCreateWithoutUserInput, CoachingDataUncheckedCreateWithoutUserInput>
  }

  export type TemplateFormCreateWithoutUserInput = {
    id?: string
    templateName: string
    institutionAddress?: string | null
    institution?: string | null
    marks?: string | null
    time?: string | null
    exam?: string | null
    subject?: string | null
    logo?: string | null
    saveTemplate: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TemplateFormUncheckedCreateWithoutUserInput = {
    id?: string
    templateName: string
    institutionAddress?: string | null
    institution?: string | null
    marks?: string | null
    time?: string | null
    exam?: string | null
    subject?: string | null
    logo?: string | null
    saveTemplate: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TemplateFormCreateOrConnectWithoutUserInput = {
    where: TemplateFormWhereUniqueInput
    create: XOR<TemplateFormCreateWithoutUserInput, TemplateFormUncheckedCreateWithoutUserInput>
  }

  export type TemplateFormCreateManyUserInputEnvelope = {
    data: TemplateFormCreateManyUserInput | TemplateFormCreateManyUserInput[]
  }

  export type FolderUpsertWithWhereUniqueWithoutUserInput = {
    where: FolderWhereUniqueInput
    update: XOR<FolderUpdateWithoutUserInput, FolderUncheckedUpdateWithoutUserInput>
    create: XOR<FolderCreateWithoutUserInput, FolderUncheckedCreateWithoutUserInput>
  }

  export type FolderUpdateWithWhereUniqueWithoutUserInput = {
    where: FolderWhereUniqueInput
    data: XOR<FolderUpdateWithoutUserInput, FolderUncheckedUpdateWithoutUserInput>
  }

  export type FolderUpdateManyWithWhereWithoutUserInput = {
    where: FolderScalarWhereInput
    data: XOR<FolderUpdateManyMutationInput, FolderUncheckedUpdateManyWithoutUserInput>
  }

  export type FolderScalarWhereInput = {
    AND?: FolderScalarWhereInput | FolderScalarWhereInput[]
    OR?: FolderScalarWhereInput[]
    NOT?: FolderScalarWhereInput | FolderScalarWhereInput[]
    id?: StringFilter<"Folder"> | string
    name?: StringFilter<"Folder"> | string
    userId?: StringFilter<"Folder"> | string
    createdAt?: DateTimeFilter<"Folder"> | Date | string
    updatedAt?: DateTimeFilter<"Folder"> | Date | string
  }

  export type TeacherDataUpsertWithoutUserInput = {
    update: XOR<TeacherDataUpdateWithoutUserInput, TeacherDataUncheckedUpdateWithoutUserInput>
    create: XOR<TeacherDataCreateWithoutUserInput, TeacherDataUncheckedCreateWithoutUserInput>
    where?: TeacherDataWhereInput
  }

  export type TeacherDataUpdateToOneWithWhereWithoutUserInput = {
    where?: TeacherDataWhereInput
    data: XOR<TeacherDataUpdateWithoutUserInput, TeacherDataUncheckedUpdateWithoutUserInput>
  }

  export type TeacherDataUpdateWithoutUserInput = {
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    school?: StringFieldUpdateOperationsInput | string
    subject?: StringFieldUpdateOperationsInput | string
    experience?: NullableStringFieldUpdateOperationsInput | string | null
    studentCount?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TeacherDataUncheckedUpdateWithoutUserInput = {
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    school?: StringFieldUpdateOperationsInput | string
    subject?: StringFieldUpdateOperationsInput | string
    experience?: NullableStringFieldUpdateOperationsInput | string | null
    studentCount?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StudentDataUpsertWithoutUserInput = {
    update: XOR<StudentDataUpdateWithoutUserInput, StudentDataUncheckedUpdateWithoutUserInput>
    create: XOR<StudentDataCreateWithoutUserInput, StudentDataUncheckedCreateWithoutUserInput>
    where?: StudentDataWhereInput
  }

  export type StudentDataUpdateToOneWithWhereWithoutUserInput = {
    where?: StudentDataWhereInput
    data: XOR<StudentDataUpdateWithoutUserInput, StudentDataUncheckedUpdateWithoutUserInput>
  }

  export type StudentDataUpdateWithoutUserInput = {
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    grade?: StringFieldUpdateOperationsInput | string
    targetExam?: StringFieldUpdateOperationsInput | string
    subjects?: StudentDataUpdatesubjectsInput | string[]
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StudentDataUncheckedUpdateWithoutUserInput = {
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    grade?: StringFieldUpdateOperationsInput | string
    targetExam?: StringFieldUpdateOperationsInput | string
    subjects?: StudentDataUpdatesubjectsInput | string[]
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CoachingDataUpsertWithoutUserInput = {
    update: XOR<CoachingDataUpdateWithoutUserInput, CoachingDataUncheckedUpdateWithoutUserInput>
    create: XOR<CoachingDataCreateWithoutUserInput, CoachingDataUncheckedCreateWithoutUserInput>
    where?: CoachingDataWhereInput
  }

  export type CoachingDataUpdateToOneWithWhereWithoutUserInput = {
    where?: CoachingDataWhereInput
    data: XOR<CoachingDataUpdateWithoutUserInput, CoachingDataUncheckedUpdateWithoutUserInput>
  }

  export type CoachingDataUpdateWithoutUserInput = {
    centerName?: StringFieldUpdateOperationsInput | string
    contactPerson?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    phone?: StringFieldUpdateOperationsInput | string
    location?: StringFieldUpdateOperationsInput | string
    teacherCount?: NullableStringFieldUpdateOperationsInput | string | null
    studentCount?: NullableStringFieldUpdateOperationsInput | string | null
    targetExams?: CoachingDataUpdatetargetExamsInput | string[]
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CoachingDataUncheckedUpdateWithoutUserInput = {
    centerName?: StringFieldUpdateOperationsInput | string
    contactPerson?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    phone?: StringFieldUpdateOperationsInput | string
    location?: StringFieldUpdateOperationsInput | string
    teacherCount?: NullableStringFieldUpdateOperationsInput | string | null
    studentCount?: NullableStringFieldUpdateOperationsInput | string | null
    targetExams?: CoachingDataUpdatetargetExamsInput | string[]
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TemplateFormUpsertWithWhereUniqueWithoutUserInput = {
    where: TemplateFormWhereUniqueInput
    update: XOR<TemplateFormUpdateWithoutUserInput, TemplateFormUncheckedUpdateWithoutUserInput>
    create: XOR<TemplateFormCreateWithoutUserInput, TemplateFormUncheckedCreateWithoutUserInput>
  }

  export type TemplateFormUpdateWithWhereUniqueWithoutUserInput = {
    where: TemplateFormWhereUniqueInput
    data: XOR<TemplateFormUpdateWithoutUserInput, TemplateFormUncheckedUpdateWithoutUserInput>
  }

  export type TemplateFormUpdateManyWithWhereWithoutUserInput = {
    where: TemplateFormScalarWhereInput
    data: XOR<TemplateFormUpdateManyMutationInput, TemplateFormUncheckedUpdateManyWithoutUserInput>
  }

  export type TemplateFormScalarWhereInput = {
    AND?: TemplateFormScalarWhereInput | TemplateFormScalarWhereInput[]
    OR?: TemplateFormScalarWhereInput[]
    NOT?: TemplateFormScalarWhereInput | TemplateFormScalarWhereInput[]
    id?: StringFilter<"TemplateForm"> | string
    userId?: StringFilter<"TemplateForm"> | string
    templateName?: StringFilter<"TemplateForm"> | string
    institutionAddress?: StringNullableFilter<"TemplateForm"> | string | null
    institution?: StringNullableFilter<"TemplateForm"> | string | null
    marks?: StringNullableFilter<"TemplateForm"> | string | null
    time?: StringNullableFilter<"TemplateForm"> | string | null
    exam?: StringNullableFilter<"TemplateForm"> | string | null
    subject?: StringNullableFilter<"TemplateForm"> | string | null
    logo?: StringNullableFilter<"TemplateForm"> | string | null
    saveTemplate?: BoolFilter<"TemplateForm"> | boolean
    createdAt?: DateTimeFilter<"TemplateForm"> | Date | string
    updatedAt?: DateTimeFilter<"TemplateForm"> | Date | string
  }

  export type UserCreateWithoutTeacherDataInput = {
    id?: string
    clerkUserId: string
    email?: string | null
    name?: string | null
    emailOtp?: string | null
    phoneOtp?: string | null
    otpExpiry?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    profileImage?: string | null
    role: string
    drafts?: FolderCreateNestedManyWithoutUserInput
    studentData?: StudentDataCreateNestedOneWithoutUserInput
    coachingData?: CoachingDataCreateNestedOneWithoutUserInput
    templateForm?: TemplateFormCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutTeacherDataInput = {
    id?: string
    clerkUserId: string
    email?: string | null
    name?: string | null
    emailOtp?: string | null
    phoneOtp?: string | null
    otpExpiry?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    profileImage?: string | null
    role: string
    drafts?: FolderUncheckedCreateNestedManyWithoutUserInput
    studentData?: StudentDataUncheckedCreateNestedOneWithoutUserInput
    coachingData?: CoachingDataUncheckedCreateNestedOneWithoutUserInput
    templateForm?: TemplateFormUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutTeacherDataInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutTeacherDataInput, UserUncheckedCreateWithoutTeacherDataInput>
  }

  export type UserUpsertWithoutTeacherDataInput = {
    update: XOR<UserUpdateWithoutTeacherDataInput, UserUncheckedUpdateWithoutTeacherDataInput>
    create: XOR<UserCreateWithoutTeacherDataInput, UserUncheckedCreateWithoutTeacherDataInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutTeacherDataInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutTeacherDataInput, UserUncheckedUpdateWithoutTeacherDataInput>
  }

  export type UserUpdateWithoutTeacherDataInput = {
    clerkUserId?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    name?: NullableStringFieldUpdateOperationsInput | string | null
    emailOtp?: NullableStringFieldUpdateOperationsInput | string | null
    phoneOtp?: NullableStringFieldUpdateOperationsInput | string | null
    otpExpiry?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    profileImage?: NullableStringFieldUpdateOperationsInput | string | null
    role?: StringFieldUpdateOperationsInput | string
    drafts?: FolderUpdateManyWithoutUserNestedInput
    studentData?: StudentDataUpdateOneWithoutUserNestedInput
    coachingData?: CoachingDataUpdateOneWithoutUserNestedInput
    templateForm?: TemplateFormUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutTeacherDataInput = {
    clerkUserId?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    name?: NullableStringFieldUpdateOperationsInput | string | null
    emailOtp?: NullableStringFieldUpdateOperationsInput | string | null
    phoneOtp?: NullableStringFieldUpdateOperationsInput | string | null
    otpExpiry?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    profileImage?: NullableStringFieldUpdateOperationsInput | string | null
    role?: StringFieldUpdateOperationsInput | string
    drafts?: FolderUncheckedUpdateManyWithoutUserNestedInput
    studentData?: StudentDataUncheckedUpdateOneWithoutUserNestedInput
    coachingData?: CoachingDataUncheckedUpdateOneWithoutUserNestedInput
    templateForm?: TemplateFormUncheckedUpdateManyWithoutUserNestedInput
  }

  export type UserCreateWithoutStudentDataInput = {
    id?: string
    clerkUserId: string
    email?: string | null
    name?: string | null
    emailOtp?: string | null
    phoneOtp?: string | null
    otpExpiry?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    profileImage?: string | null
    role: string
    drafts?: FolderCreateNestedManyWithoutUserInput
    teacherData?: TeacherDataCreateNestedOneWithoutUserInput
    coachingData?: CoachingDataCreateNestedOneWithoutUserInput
    templateForm?: TemplateFormCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutStudentDataInput = {
    id?: string
    clerkUserId: string
    email?: string | null
    name?: string | null
    emailOtp?: string | null
    phoneOtp?: string | null
    otpExpiry?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    profileImage?: string | null
    role: string
    drafts?: FolderUncheckedCreateNestedManyWithoutUserInput
    teacherData?: TeacherDataUncheckedCreateNestedOneWithoutUserInput
    coachingData?: CoachingDataUncheckedCreateNestedOneWithoutUserInput
    templateForm?: TemplateFormUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutStudentDataInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutStudentDataInput, UserUncheckedCreateWithoutStudentDataInput>
  }

  export type UserUpsertWithoutStudentDataInput = {
    update: XOR<UserUpdateWithoutStudentDataInput, UserUncheckedUpdateWithoutStudentDataInput>
    create: XOR<UserCreateWithoutStudentDataInput, UserUncheckedCreateWithoutStudentDataInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutStudentDataInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutStudentDataInput, UserUncheckedUpdateWithoutStudentDataInput>
  }

  export type UserUpdateWithoutStudentDataInput = {
    clerkUserId?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    name?: NullableStringFieldUpdateOperationsInput | string | null
    emailOtp?: NullableStringFieldUpdateOperationsInput | string | null
    phoneOtp?: NullableStringFieldUpdateOperationsInput | string | null
    otpExpiry?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    profileImage?: NullableStringFieldUpdateOperationsInput | string | null
    role?: StringFieldUpdateOperationsInput | string
    drafts?: FolderUpdateManyWithoutUserNestedInput
    teacherData?: TeacherDataUpdateOneWithoutUserNestedInput
    coachingData?: CoachingDataUpdateOneWithoutUserNestedInput
    templateForm?: TemplateFormUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutStudentDataInput = {
    clerkUserId?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    name?: NullableStringFieldUpdateOperationsInput | string | null
    emailOtp?: NullableStringFieldUpdateOperationsInput | string | null
    phoneOtp?: NullableStringFieldUpdateOperationsInput | string | null
    otpExpiry?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    profileImage?: NullableStringFieldUpdateOperationsInput | string | null
    role?: StringFieldUpdateOperationsInput | string
    drafts?: FolderUncheckedUpdateManyWithoutUserNestedInput
    teacherData?: TeacherDataUncheckedUpdateOneWithoutUserNestedInput
    coachingData?: CoachingDataUncheckedUpdateOneWithoutUserNestedInput
    templateForm?: TemplateFormUncheckedUpdateManyWithoutUserNestedInput
  }

  export type UserCreateWithoutCoachingDataInput = {
    id?: string
    clerkUserId: string
    email?: string | null
    name?: string | null
    emailOtp?: string | null
    phoneOtp?: string | null
    otpExpiry?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    profileImage?: string | null
    role: string
    drafts?: FolderCreateNestedManyWithoutUserInput
    teacherData?: TeacherDataCreateNestedOneWithoutUserInput
    studentData?: StudentDataCreateNestedOneWithoutUserInput
    templateForm?: TemplateFormCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutCoachingDataInput = {
    id?: string
    clerkUserId: string
    email?: string | null
    name?: string | null
    emailOtp?: string | null
    phoneOtp?: string | null
    otpExpiry?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    profileImage?: string | null
    role: string
    drafts?: FolderUncheckedCreateNestedManyWithoutUserInput
    teacherData?: TeacherDataUncheckedCreateNestedOneWithoutUserInput
    studentData?: StudentDataUncheckedCreateNestedOneWithoutUserInput
    templateForm?: TemplateFormUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutCoachingDataInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutCoachingDataInput, UserUncheckedCreateWithoutCoachingDataInput>
  }

  export type UserUpsertWithoutCoachingDataInput = {
    update: XOR<UserUpdateWithoutCoachingDataInput, UserUncheckedUpdateWithoutCoachingDataInput>
    create: XOR<UserCreateWithoutCoachingDataInput, UserUncheckedCreateWithoutCoachingDataInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutCoachingDataInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutCoachingDataInput, UserUncheckedUpdateWithoutCoachingDataInput>
  }

  export type UserUpdateWithoutCoachingDataInput = {
    clerkUserId?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    name?: NullableStringFieldUpdateOperationsInput | string | null
    emailOtp?: NullableStringFieldUpdateOperationsInput | string | null
    phoneOtp?: NullableStringFieldUpdateOperationsInput | string | null
    otpExpiry?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    profileImage?: NullableStringFieldUpdateOperationsInput | string | null
    role?: StringFieldUpdateOperationsInput | string
    drafts?: FolderUpdateManyWithoutUserNestedInput
    teacherData?: TeacherDataUpdateOneWithoutUserNestedInput
    studentData?: StudentDataUpdateOneWithoutUserNestedInput
    templateForm?: TemplateFormUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutCoachingDataInput = {
    clerkUserId?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    name?: NullableStringFieldUpdateOperationsInput | string | null
    emailOtp?: NullableStringFieldUpdateOperationsInput | string | null
    phoneOtp?: NullableStringFieldUpdateOperationsInput | string | null
    otpExpiry?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    profileImage?: NullableStringFieldUpdateOperationsInput | string | null
    role?: StringFieldUpdateOperationsInput | string
    drafts?: FolderUncheckedUpdateManyWithoutUserNestedInput
    teacherData?: TeacherDataUncheckedUpdateOneWithoutUserNestedInput
    studentData?: StudentDataUncheckedUpdateOneWithoutUserNestedInput
    templateForm?: TemplateFormUncheckedUpdateManyWithoutUserNestedInput
  }

  export type FolderQuestionCreateWithoutQuestionInput = {
    id?: string
    folder: FolderCreateNestedOneWithoutQuestionRelationsInput
  }

  export type FolderQuestionUncheckedCreateWithoutQuestionInput = {
    id?: string
    folderId: string
  }

  export type FolderQuestionCreateOrConnectWithoutQuestionInput = {
    where: FolderQuestionWhereUniqueInput
    create: XOR<FolderQuestionCreateWithoutQuestionInput, FolderQuestionUncheckedCreateWithoutQuestionInput>
  }

  export type FolderQuestionCreateManyQuestionInputEnvelope = {
    data: FolderQuestionCreateManyQuestionInput | FolderQuestionCreateManyQuestionInput[]
  }

  export type FolderQuestionUpsertWithWhereUniqueWithoutQuestionInput = {
    where: FolderQuestionWhereUniqueInput
    update: XOR<FolderQuestionUpdateWithoutQuestionInput, FolderQuestionUncheckedUpdateWithoutQuestionInput>
    create: XOR<FolderQuestionCreateWithoutQuestionInput, FolderQuestionUncheckedCreateWithoutQuestionInput>
  }

  export type FolderQuestionUpdateWithWhereUniqueWithoutQuestionInput = {
    where: FolderQuestionWhereUniqueInput
    data: XOR<FolderQuestionUpdateWithoutQuestionInput, FolderQuestionUncheckedUpdateWithoutQuestionInput>
  }

  export type FolderQuestionUpdateManyWithWhereWithoutQuestionInput = {
    where: FolderQuestionScalarWhereInput
    data: XOR<FolderQuestionUpdateManyMutationInput, FolderQuestionUncheckedUpdateManyWithoutQuestionInput>
  }

  export type FolderQuestionScalarWhereInput = {
    AND?: FolderQuestionScalarWhereInput | FolderQuestionScalarWhereInput[]
    OR?: FolderQuestionScalarWhereInput[]
    NOT?: FolderQuestionScalarWhereInput | FolderQuestionScalarWhereInput[]
    id?: StringFilter<"FolderQuestion"> | string
    folderId?: StringFilter<"FolderQuestion"> | string
    questionId?: StringFilter<"FolderQuestion"> | string
  }

  export type UserCreateWithoutDraftsInput = {
    id?: string
    clerkUserId: string
    email?: string | null
    name?: string | null
    emailOtp?: string | null
    phoneOtp?: string | null
    otpExpiry?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    profileImage?: string | null
    role: string
    teacherData?: TeacherDataCreateNestedOneWithoutUserInput
    studentData?: StudentDataCreateNestedOneWithoutUserInput
    coachingData?: CoachingDataCreateNestedOneWithoutUserInput
    templateForm?: TemplateFormCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutDraftsInput = {
    id?: string
    clerkUserId: string
    email?: string | null
    name?: string | null
    emailOtp?: string | null
    phoneOtp?: string | null
    otpExpiry?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    profileImage?: string | null
    role: string
    teacherData?: TeacherDataUncheckedCreateNestedOneWithoutUserInput
    studentData?: StudentDataUncheckedCreateNestedOneWithoutUserInput
    coachingData?: CoachingDataUncheckedCreateNestedOneWithoutUserInput
    templateForm?: TemplateFormUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutDraftsInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutDraftsInput, UserUncheckedCreateWithoutDraftsInput>
  }

  export type FolderQuestionCreateWithoutFolderInput = {
    id?: string
    question: QuestionCreateNestedOneWithoutFolderRelationsInput
  }

  export type FolderQuestionUncheckedCreateWithoutFolderInput = {
    id?: string
    questionId: string
  }

  export type FolderQuestionCreateOrConnectWithoutFolderInput = {
    where: FolderQuestionWhereUniqueInput
    create: XOR<FolderQuestionCreateWithoutFolderInput, FolderQuestionUncheckedCreateWithoutFolderInput>
  }

  export type FolderQuestionCreateManyFolderInputEnvelope = {
    data: FolderQuestionCreateManyFolderInput | FolderQuestionCreateManyFolderInput[]
  }

  export type UserUpsertWithoutDraftsInput = {
    update: XOR<UserUpdateWithoutDraftsInput, UserUncheckedUpdateWithoutDraftsInput>
    create: XOR<UserCreateWithoutDraftsInput, UserUncheckedCreateWithoutDraftsInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutDraftsInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutDraftsInput, UserUncheckedUpdateWithoutDraftsInput>
  }

  export type UserUpdateWithoutDraftsInput = {
    clerkUserId?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    name?: NullableStringFieldUpdateOperationsInput | string | null
    emailOtp?: NullableStringFieldUpdateOperationsInput | string | null
    phoneOtp?: NullableStringFieldUpdateOperationsInput | string | null
    otpExpiry?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    profileImage?: NullableStringFieldUpdateOperationsInput | string | null
    role?: StringFieldUpdateOperationsInput | string
    teacherData?: TeacherDataUpdateOneWithoutUserNestedInput
    studentData?: StudentDataUpdateOneWithoutUserNestedInput
    coachingData?: CoachingDataUpdateOneWithoutUserNestedInput
    templateForm?: TemplateFormUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutDraftsInput = {
    clerkUserId?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    name?: NullableStringFieldUpdateOperationsInput | string | null
    emailOtp?: NullableStringFieldUpdateOperationsInput | string | null
    phoneOtp?: NullableStringFieldUpdateOperationsInput | string | null
    otpExpiry?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    profileImage?: NullableStringFieldUpdateOperationsInput | string | null
    role?: StringFieldUpdateOperationsInput | string
    teacherData?: TeacherDataUncheckedUpdateOneWithoutUserNestedInput
    studentData?: StudentDataUncheckedUpdateOneWithoutUserNestedInput
    coachingData?: CoachingDataUncheckedUpdateOneWithoutUserNestedInput
    templateForm?: TemplateFormUncheckedUpdateManyWithoutUserNestedInput
  }

  export type FolderQuestionUpsertWithWhereUniqueWithoutFolderInput = {
    where: FolderQuestionWhereUniqueInput
    update: XOR<FolderQuestionUpdateWithoutFolderInput, FolderQuestionUncheckedUpdateWithoutFolderInput>
    create: XOR<FolderQuestionCreateWithoutFolderInput, FolderQuestionUncheckedCreateWithoutFolderInput>
  }

  export type FolderQuestionUpdateWithWhereUniqueWithoutFolderInput = {
    where: FolderQuestionWhereUniqueInput
    data: XOR<FolderQuestionUpdateWithoutFolderInput, FolderQuestionUncheckedUpdateWithoutFolderInput>
  }

  export type FolderQuestionUpdateManyWithWhereWithoutFolderInput = {
    where: FolderQuestionScalarWhereInput
    data: XOR<FolderQuestionUpdateManyMutationInput, FolderQuestionUncheckedUpdateManyWithoutFolderInput>
  }

  export type FolderCreateWithoutQuestionRelationsInput = {
    id?: string
    name: string
    createdAt?: Date | string
    updatedAt?: Date | string
    user: UserCreateNestedOneWithoutDraftsInput
  }

  export type FolderUncheckedCreateWithoutQuestionRelationsInput = {
    id?: string
    name: string
    userId: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type FolderCreateOrConnectWithoutQuestionRelationsInput = {
    where: FolderWhereUniqueInput
    create: XOR<FolderCreateWithoutQuestionRelationsInput, FolderUncheckedCreateWithoutQuestionRelationsInput>
  }

  export type QuestionCreateWithoutFolderRelationsInput = {
    id?: string
    question_number: number
    file_name?: string | null
    question_text: string
    isQuestionImage?: boolean
    question_image?: string | null
    isOptionImage?: boolean
    options?: QuestionCreateoptionsInput | string[]
    option_images?: QuestionCreateoption_imagesInput | string[]
    section_name?: string | null
    question_type?: string | null
    topic?: string | null
    exam_name?: string | null
    subject?: string | null
    chapter?: string | null
    answer?: string | null
    flagged?: boolean | null
  }

  export type QuestionUncheckedCreateWithoutFolderRelationsInput = {
    id?: string
    question_number: number
    file_name?: string | null
    question_text: string
    isQuestionImage?: boolean
    question_image?: string | null
    isOptionImage?: boolean
    options?: QuestionCreateoptionsInput | string[]
    option_images?: QuestionCreateoption_imagesInput | string[]
    section_name?: string | null
    question_type?: string | null
    topic?: string | null
    exam_name?: string | null
    subject?: string | null
    chapter?: string | null
    answer?: string | null
    flagged?: boolean | null
  }

  export type QuestionCreateOrConnectWithoutFolderRelationsInput = {
    where: QuestionWhereUniqueInput
    create: XOR<QuestionCreateWithoutFolderRelationsInput, QuestionUncheckedCreateWithoutFolderRelationsInput>
  }

  export type FolderUpsertWithoutQuestionRelationsInput = {
    update: XOR<FolderUpdateWithoutQuestionRelationsInput, FolderUncheckedUpdateWithoutQuestionRelationsInput>
    create: XOR<FolderCreateWithoutQuestionRelationsInput, FolderUncheckedCreateWithoutQuestionRelationsInput>
    where?: FolderWhereInput
  }

  export type FolderUpdateToOneWithWhereWithoutQuestionRelationsInput = {
    where?: FolderWhereInput
    data: XOR<FolderUpdateWithoutQuestionRelationsInput, FolderUncheckedUpdateWithoutQuestionRelationsInput>
  }

  export type FolderUpdateWithoutQuestionRelationsInput = {
    name?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutDraftsNestedInput
  }

  export type FolderUncheckedUpdateWithoutQuestionRelationsInput = {
    name?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type QuestionUpsertWithoutFolderRelationsInput = {
    update: XOR<QuestionUpdateWithoutFolderRelationsInput, QuestionUncheckedUpdateWithoutFolderRelationsInput>
    create: XOR<QuestionCreateWithoutFolderRelationsInput, QuestionUncheckedCreateWithoutFolderRelationsInput>
    where?: QuestionWhereInput
  }

  export type QuestionUpdateToOneWithWhereWithoutFolderRelationsInput = {
    where?: QuestionWhereInput
    data: XOR<QuestionUpdateWithoutFolderRelationsInput, QuestionUncheckedUpdateWithoutFolderRelationsInput>
  }

  export type QuestionUpdateWithoutFolderRelationsInput = {
    question_number?: IntFieldUpdateOperationsInput | number
    file_name?: NullableStringFieldUpdateOperationsInput | string | null
    question_text?: StringFieldUpdateOperationsInput | string
    isQuestionImage?: BoolFieldUpdateOperationsInput | boolean
    question_image?: NullableStringFieldUpdateOperationsInput | string | null
    isOptionImage?: BoolFieldUpdateOperationsInput | boolean
    options?: QuestionUpdateoptionsInput | string[]
    option_images?: QuestionUpdateoption_imagesInput | string[]
    section_name?: NullableStringFieldUpdateOperationsInput | string | null
    question_type?: NullableStringFieldUpdateOperationsInput | string | null
    topic?: NullableStringFieldUpdateOperationsInput | string | null
    exam_name?: NullableStringFieldUpdateOperationsInput | string | null
    subject?: NullableStringFieldUpdateOperationsInput | string | null
    chapter?: NullableStringFieldUpdateOperationsInput | string | null
    answer?: NullableStringFieldUpdateOperationsInput | string | null
    flagged?: NullableBoolFieldUpdateOperationsInput | boolean | null
  }

  export type QuestionUncheckedUpdateWithoutFolderRelationsInput = {
    question_number?: IntFieldUpdateOperationsInput | number
    file_name?: NullableStringFieldUpdateOperationsInput | string | null
    question_text?: StringFieldUpdateOperationsInput | string
    isQuestionImage?: BoolFieldUpdateOperationsInput | boolean
    question_image?: NullableStringFieldUpdateOperationsInput | string | null
    isOptionImage?: BoolFieldUpdateOperationsInput | boolean
    options?: QuestionUpdateoptionsInput | string[]
    option_images?: QuestionUpdateoption_imagesInput | string[]
    section_name?: NullableStringFieldUpdateOperationsInput | string | null
    question_type?: NullableStringFieldUpdateOperationsInput | string | null
    topic?: NullableStringFieldUpdateOperationsInput | string | null
    exam_name?: NullableStringFieldUpdateOperationsInput | string | null
    subject?: NullableStringFieldUpdateOperationsInput | string | null
    chapter?: NullableStringFieldUpdateOperationsInput | string | null
    answer?: NullableStringFieldUpdateOperationsInput | string | null
    flagged?: NullableBoolFieldUpdateOperationsInput | boolean | null
  }

  export type UserCreateWithoutTemplateFormInput = {
    id?: string
    clerkUserId: string
    email?: string | null
    name?: string | null
    emailOtp?: string | null
    phoneOtp?: string | null
    otpExpiry?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    profileImage?: string | null
    role: string
    drafts?: FolderCreateNestedManyWithoutUserInput
    teacherData?: TeacherDataCreateNestedOneWithoutUserInput
    studentData?: StudentDataCreateNestedOneWithoutUserInput
    coachingData?: CoachingDataCreateNestedOneWithoutUserInput
  }

  export type UserUncheckedCreateWithoutTemplateFormInput = {
    id?: string
    clerkUserId: string
    email?: string | null
    name?: string | null
    emailOtp?: string | null
    phoneOtp?: string | null
    otpExpiry?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    profileImage?: string | null
    role: string
    drafts?: FolderUncheckedCreateNestedManyWithoutUserInput
    teacherData?: TeacherDataUncheckedCreateNestedOneWithoutUserInput
    studentData?: StudentDataUncheckedCreateNestedOneWithoutUserInput
    coachingData?: CoachingDataUncheckedCreateNestedOneWithoutUserInput
  }

  export type UserCreateOrConnectWithoutTemplateFormInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutTemplateFormInput, UserUncheckedCreateWithoutTemplateFormInput>
  }

  export type UserUpsertWithoutTemplateFormInput = {
    update: XOR<UserUpdateWithoutTemplateFormInput, UserUncheckedUpdateWithoutTemplateFormInput>
    create: XOR<UserCreateWithoutTemplateFormInput, UserUncheckedCreateWithoutTemplateFormInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutTemplateFormInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutTemplateFormInput, UserUncheckedUpdateWithoutTemplateFormInput>
  }

  export type UserUpdateWithoutTemplateFormInput = {
    clerkUserId?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    name?: NullableStringFieldUpdateOperationsInput | string | null
    emailOtp?: NullableStringFieldUpdateOperationsInput | string | null
    phoneOtp?: NullableStringFieldUpdateOperationsInput | string | null
    otpExpiry?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    profileImage?: NullableStringFieldUpdateOperationsInput | string | null
    role?: StringFieldUpdateOperationsInput | string
    drafts?: FolderUpdateManyWithoutUserNestedInput
    teacherData?: TeacherDataUpdateOneWithoutUserNestedInput
    studentData?: StudentDataUpdateOneWithoutUserNestedInput
    coachingData?: CoachingDataUpdateOneWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutTemplateFormInput = {
    clerkUserId?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    name?: NullableStringFieldUpdateOperationsInput | string | null
    emailOtp?: NullableStringFieldUpdateOperationsInput | string | null
    phoneOtp?: NullableStringFieldUpdateOperationsInput | string | null
    otpExpiry?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    profileImage?: NullableStringFieldUpdateOperationsInput | string | null
    role?: StringFieldUpdateOperationsInput | string
    drafts?: FolderUncheckedUpdateManyWithoutUserNestedInput
    teacherData?: TeacherDataUncheckedUpdateOneWithoutUserNestedInput
    studentData?: StudentDataUncheckedUpdateOneWithoutUserNestedInput
    coachingData?: CoachingDataUncheckedUpdateOneWithoutUserNestedInput
  }

  export type FolderCreateManyUserInput = {
    id?: string
    name: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TemplateFormCreateManyUserInput = {
    id?: string
    templateName: string
    institutionAddress?: string | null
    institution?: string | null
    marks?: string | null
    time?: string | null
    exam?: string | null
    subject?: string | null
    logo?: string | null
    saveTemplate: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type FolderUpdateWithoutUserInput = {
    name?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    questionRelations?: FolderQuestionUpdateManyWithoutFolderNestedInput
  }

  export type FolderUncheckedUpdateWithoutUserInput = {
    name?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    questionRelations?: FolderQuestionUncheckedUpdateManyWithoutFolderNestedInput
  }

  export type FolderUncheckedUpdateManyWithoutUserInput = {
    name?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TemplateFormUpdateWithoutUserInput = {
    templateName?: StringFieldUpdateOperationsInput | string
    institutionAddress?: NullableStringFieldUpdateOperationsInput | string | null
    institution?: NullableStringFieldUpdateOperationsInput | string | null
    marks?: NullableStringFieldUpdateOperationsInput | string | null
    time?: NullableStringFieldUpdateOperationsInput | string | null
    exam?: NullableStringFieldUpdateOperationsInput | string | null
    subject?: NullableStringFieldUpdateOperationsInput | string | null
    logo?: NullableStringFieldUpdateOperationsInput | string | null
    saveTemplate?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TemplateFormUncheckedUpdateWithoutUserInput = {
    templateName?: StringFieldUpdateOperationsInput | string
    institutionAddress?: NullableStringFieldUpdateOperationsInput | string | null
    institution?: NullableStringFieldUpdateOperationsInput | string | null
    marks?: NullableStringFieldUpdateOperationsInput | string | null
    time?: NullableStringFieldUpdateOperationsInput | string | null
    exam?: NullableStringFieldUpdateOperationsInput | string | null
    subject?: NullableStringFieldUpdateOperationsInput | string | null
    logo?: NullableStringFieldUpdateOperationsInput | string | null
    saveTemplate?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TemplateFormUncheckedUpdateManyWithoutUserInput = {
    templateName?: StringFieldUpdateOperationsInput | string
    institutionAddress?: NullableStringFieldUpdateOperationsInput | string | null
    institution?: NullableStringFieldUpdateOperationsInput | string | null
    marks?: NullableStringFieldUpdateOperationsInput | string | null
    time?: NullableStringFieldUpdateOperationsInput | string | null
    exam?: NullableStringFieldUpdateOperationsInput | string | null
    subject?: NullableStringFieldUpdateOperationsInput | string | null
    logo?: NullableStringFieldUpdateOperationsInput | string | null
    saveTemplate?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type FolderQuestionCreateManyQuestionInput = {
    id?: string
    folderId: string
  }

  export type FolderQuestionUpdateWithoutQuestionInput = {
    folder?: FolderUpdateOneRequiredWithoutQuestionRelationsNestedInput
  }

  export type FolderQuestionUncheckedUpdateWithoutQuestionInput = {
    folderId?: StringFieldUpdateOperationsInput | string
  }

  export type FolderQuestionUncheckedUpdateManyWithoutQuestionInput = {
    folderId?: StringFieldUpdateOperationsInput | string
  }

  export type FolderQuestionCreateManyFolderInput = {
    id?: string
    questionId: string
  }

  export type FolderQuestionUpdateWithoutFolderInput = {
    question?: QuestionUpdateOneRequiredWithoutFolderRelationsNestedInput
  }

  export type FolderQuestionUncheckedUpdateWithoutFolderInput = {
    questionId?: StringFieldUpdateOperationsInput | string
  }

  export type FolderQuestionUncheckedUpdateManyWithoutFolderInput = {
    questionId?: StringFieldUpdateOperationsInput | string
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}