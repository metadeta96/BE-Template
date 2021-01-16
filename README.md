# DEEL BACKEND TASK

💫 Welcome! 🎉

This is a backend exercise. You can find the original link [here](https://github.com/pcerminato/BE-Template).

It was developed using [TDD](https://en.wikipedia.org/wiki/Test-driven_development), [gitflow](https://datasift.github.io/gitflow/IntroducingGitFlow.html) and [commitlint](https://commitlint.js.org/#/).

## Set Up

  

- Start by cloning this repository.

  

- In the repo root directory, run `npm install` to gather all dependencies.

  

- Run `npm test` to execute the unit tests.

  

- Next, `npm run seed` will seed the local SQLite database. **Warning: This will drop the database if it exists**. The database lives in a local file `database.sqlite3`.

  

- Then run `npm start` which should start both the server and the React client.

  


## APIs Implemented

  

Below is a list of the implemented APIs for this task

  


1. ***GET*** `/contracts/:id` - This API is broken 😵! it should return the contract only if it belongs to the profile calling. better fix that!

1. ***GET*** `/contracts` - Returns a list of contracts belonging to a user (client or contractor), the list should only contain non terminated contracts.

1. ***GET*** `/jobs/unpaid` -  Get all unpaid jobs for a user (***either*** a client or contractor), for ***active contracts only***.

1. ***POST*** `/jobs/:job_id/pay` - Pay for a job, a client can only pay if his balance >= the amount to pay. The amount should be moved from the client's balance to the contractor balance.

1. ***POST*** `/balances/deposit/:userId` - Deposits money into the the the balance of a client, a client can't deposit more than 25% his total of jobs to pay. (at the deposit moment)

1. ***GET*** `/admin/best-profession?start=<date>&end=<date>` - Returns the profession that earned the most money (sum of jobs paid) for any contactor that worked in the query time range.

1. ***GET*** `/admin/best-clients?start=<date>&end=<date>&limit=<integer>` - returns the clients the paid the most for jobs in the query time period. limit query parameter should be applied, default limit is 2.
```
 [
    {
        "id": 1,
        "fullName": "Reece Moyer",
        "paid" : 100.3
    },
    {
        "id": 200,
        "fullName": "Debora Martin",
        "paid" : 99
    },
    {
        "id": 22,
        "fullName": "Debora Martin",
        "paid" : 21
    }
]
```

  

## What could be improved

* Implement an authentication API and replace profile_id in the headera by a token instead. From the token it is possible to find out which profile is it.

* Admin API is public, it should be private or run on a separated service.

* In the Profile API, the route /balances/deposit/:userId is also public. It should be private and if it is going to be called by client itself then it should use a token instead of passing the profile id in the path as parameter.

* Use Typescript for better statical analysis.

* Test the performance of the raw queries in the Admin API against full sequelize implementations.
