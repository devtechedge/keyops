#!/usr/bin/env node
import { Command } from "commander";

const program = new Command();

program
  .name("keyops")
  .description("Rotate AI API keys across every consumer with verification and rollback.")
  .version("0.1.0");

program.parse();
