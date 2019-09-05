const mysql = require("mysql")
const express = require("express")
const app = express()

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "http://localhost:1234")
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept"
    )
    next()
})

const connection = mysql.createConnection({
    host: "datascience-int.cs6p5rczr2xv.us-east-1.rds.amazonaws.com",
    port: "3306",
    user: "ezinterview",
    password: "98DIM9yBhZh1",
    database: "Sales"
})

connection.connect(err => {
    if (err) throw err
    else console.log("Connected")
})

const enroute = table => {
    app.get(table.path, (req, res) => {
        const query = table.query(req.query)
        console.log(table.name, query, req.originalUrl)
        connection.query(query, (error, results) => {
            if (error) throw error
            res.send(
                JSON.stringify({
                    status: 200,
                    error: null,
                    response: results
                })
            )
        })
    })

}
app.use(express.json())
app.post('/productlines', (req, res) => {
    const {keyName, row} = req.body

    const columnKeys = Object.keys(row).filter(x => x !== keyName)
    const setClause = columnKeys.map(key => `${key} = '${row[key]}'`).join(', ')
    const tableName = 'productlines'
    const query = `UPDATE ${tableName} SET ${setClause} WHERE ${keyName} = '${row[keyName]}'`
    console.log(query)
    connection.query(query, (err, res) => {
        console.log(err, res)
    })
})

class Field {
    constructor(name, type, limit) {
        this._name = name
        this._type = type
        this._limit = limit
    }
    get name() {
        return this._name
    }
    get type() {
        return this._type
    }
    parse(value) {
        switch (this.type) {
            case "INT":
                return value
                break
            case "VARCHAR":
                return `'${value}'`
                break
            default:
                throw new Error("Unhandled type")
        }
    }
}

class Table {
    constructor(name, indexes) {
        this._name = name
        this._indexes = indexes || []
        this._indexMap = {}
        this._indexes.forEach(index => (this._indexMap[index.name] = index))
    }
    get path() {
        const parameters = this._indexes
            .map(index => index.name)
            .concat("search") // do search later
        const parameterPattern = parameters
            .map(parameter => `:${parameter}?`)
            .join("")
        // path is like `orderdetails/:orderNumber?:productCode?:search?`
        return `/${this._name}${parameterPattern}`
    }
    get name() {
        return this._name
    }
    get indexes() {
        return this._indexes
    }
    query(requestQuery) {
        console.log(requestQuery)
        // Some helper functions
        // wrap the field name in backtics, appearently it lets you use reserved
        // words and strings with special characters
        const w = name => `\`${name}\``
        const setIntersection = (left, right) =>
            new Set([...left].filter(x => right.has(x)))

        const listAllQuery = `SELECT * FROM ${w(this.name)}`

        // (1) no parameters => list all
        if (requestQuery === {}) return listAllQuery

        // (2) any id's => return something that matches all ids
        const requestQueryKeySet = new Set(Object.keys(requestQuery))
        const indexKeySet = new Set(this.indexes.map(index => index.name))
        const queryFieldNames = setIntersection(requestQueryKeySet, indexKeySet)
        if (queryFieldNames.size === 0) return listAllQuery

        const whereClause = Array.from(queryFieldNames)
            .map(fieldName => {
                const value = this._indexMap[fieldName].parse(
                    requestQuery[fieldName]
                )
                return `${w(fieldName)} = ${value}`
            })
            .join(" AND ")
        return `SELECT * FROM ${w(this.name)} WHERE ${whereClause}`

        // TODO (3) search => looks at _all_ fields to find something
    }
}

const tableData = [
    {
        name: "productlines",
        indexes: [
            {
                name: "productLine",
                type: "VARCHAR",
                limit: 50
            }
        ]
    },
    {
        name: "employees",
        indexes: [{ name: "employeeNumber", type: "INT", limit: 11 }]
    },
    {
        name: "products",
        indexes: [{ name: "productCode", type: "VARCHAR", limit: 15 }]
    },
    {
        name: "orderdetails",
        indexes: [
            { name: "orderNumber", type: "INT", limit: 11 },
            { name: "productCode", type: "VARCHAR", limit: 15 }
        ]
    },
    {
        name: "customers",
        indexes: [{ name: "customerNumber", type: "INT", limit: 11 }]
    },
    {
        name: "offices",
        indexes: [{ name: "officeCode", type: "VARCHAR", limit: 10 }]
    },
    {
        name: "orders",
        indexes: [{ name: "orderNumber", type: "INT", limit: 11 }]
    },
    {
        name: "payments",
        indexes: [
            { name: "customerNumber", type: "INT", limit: 11 },
            { name: "checkNumber", type: "VARCHAR", limit: 50 }
        ]
    }
]

app.get("/tabledata", (req, res) =>
    res.send(
        JSON.stringify({
            status: 200,
            error: null,
            response: tableData
        })
    )
)

const tables = tableData.map(data => {
    const { name, indexes } = data
    const indexFields = indexes.map(
        index => new Field(index.name, index.type, index.limit)
    )
    return new Table(name, indexFields)
})
tables.forEach(enroute)

app.listen(8082, "127.0.0.1")
