# Fixtures

Sample inputs used during pipeline development before real outputs from Dev A's pipeline are available. Fixtures are checked into git so anyone can reproduce a known-good run.

When Dev A's pipeline is producing real specs, treat the fixture as a regression test: the pipeline should still produce a working prototype from this fixture even after prompt changes.
