#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DeployWebAppStack } from '../lib/deploy-web-app-stack';
import { ProductsLambdaStack } from '../lib/products/products-lambda-stack';
import { DbTablesStack } from '../lib/db-tables-stack';
import { SeedTablesStack } from '../lib/seed-tables/seed-tables-stack';
import { ImportServiceStack } from '../lib/products/import-service-stack';

const app = new cdk.App();

new DeployWebAppStack(app, 'DeployReactAppStack', {});
const tables = new DbTablesStack(app, 'DbTablesStack');
new SeedTablesStack(app, 'SeedTablesStack', tables);
new ProductsLambdaStack(app, 'ProductsLambdaStack', tables);
new ImportServiceStack(app, 'ImportServiceStack', tables);
