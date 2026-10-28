# Builder Ledger

Builder Ledger is a construction management application
for managing construction sites, work scopes, costs,
materials, attendance, and related project information.

## Technology Stack

- Backend: ASP.NET Core Web API and MVC
- Frontend: React.js, TypeScript, and Vite
- Database: Microsoft SQL Server
- Data Access: ADO.NET and Dapper, where applicable
- Version Control: Git and GitHub

## Repository Contents

This repository contains the application source code,
database project, and related documentation.

- ASP.NET Core Web API
- ASP.NET Core MVC
- Shared .NET projects and repositories
- React frontend
- SQL Server Database Project

Update this section with the actual project folder names.

## Prerequisites

- Visual Studio 2022
- .NET SDK matching the solution's target framework
- Node.js and npm
- SQL Server
- SQL Server Management Studio (SSMS)
- Git

## Getting Started

1. Clone this repository.
2. Open the solution file in Visual Studio.
3. Configure the local database connection string.
4. Publish the SQL Database Project or run the
   documented database setup scripts.
5. Restore NuGet packages and build the solution.
6. Install frontend dependencies using `npm ci`.
7. Configure the frontend API base URL.
8. Run the API and frontend applications.

## Configuration and Security

- Keep credentials and API keys out of source control.
- Use local configuration for development secrets.
- Use environment variables or a secret store for
  deployment configuration.
- Do not commit real production connection strings.

See `.env.example` for the frontend configuration format.

## Testing

Build the .NET solution and run available automated tests.
Test API validation, authentication, database operations,
and frontend error handling before releasing changes.

## Contributing

Create a feature branch, make focused changes, test them,
and submit a pull request for review.

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

No license has been selected yet. All rights are reserved
by default unless a license is added.
