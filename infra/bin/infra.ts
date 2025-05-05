#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DeployWebAppStack } from '../lib/deploy-web-app-stack';
import { ProductsLambdaStack } from '../lib/products-lambda-stack';
import { DbTablesStack } from '../lib/db-tables-stack';
import { SeedTablesStack } from '../lib/seed-tables/seed-tables-stack';

const app = new cdk.App();

new DeployWebAppStack(app, 'DeployReactAppStack', {});
new ProductsLambdaStack(app, 'ProductsLambdaStack', {});
const tables = new DbTablesStack(app, 'DbTablesStack');
new SeedTablesStack(app, 'SeedTablesStack', tables);