## Project Setup

-   routing is done with express
-   database is mysql
-   debug via `npm run inspect` and chrome

## Goals

-   [x] return a list of items for each table
-   [x] endpoints can get single items
-   [ ] search certain fields

## API

```
/productlines/:productLine?
/employees/:employeeNumber?
/products/:productCode?
/orderdetails/:orderNumber?:productCode?
/customers/:customerNumber?
/offices/:officeCode?
/orders/:orderNumber?
/payments/:customerNumber?:checkNumber?
```

## Notes

### Database Schema

-   [field symbols](https://stackoverflow.com/a/25227399)
    -   Blue Diamond (Filled) = non-null
    -   Blue Diamond (unfilled) = nullable
    -   Red Diamond = index of other table
-   [arrows](https://stackoverflow.com/a/47439158)
    -   ![diagram](https://i.stack.imgur.com/2p4Tv.png)
