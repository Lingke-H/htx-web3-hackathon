# Market Admission Policy

Markets are only valuable if they are clear enough to settle.

## P0 Admission Rule

A market may be created only when all fields are clear:

- binary question
- project owner
- season
- trading deadline
- resolution deadline
- force-void deadline
- data source
- PASS/FAIL formula
- metadata URI
- spec hash

## Good Market Examples

- Will this project deploy a verified smart contract before demo day?
- Will this protocol emit at least 1,000 valid payment events before June 30?
- Will this repo merge at least 5 qualifying PRs before the deadline?

## Bad Market Examples

- Is this a good project?
- Will the team become successful?
- Is the AI agent impressive?

## Authority Separation

Project team:

- proposes milestone
- provides contract/repo/data source
- cannot trade in its own market

Reviewer/platform:

- validates that the milestone is binary and verifiable
- creates the market through `MarketFactory`
- can void invalid or ambiguous markets

Oracle:

- verifies data after `resolutionDeadline`
- writes a verification report
- calls `Market.settle`

Scout:

- predicts YES/NO with non-transferable credits
- can only hold one side per market

## Evidence In P0

Evidence can be displayed as context, but it does not affect P0 score.

Reason:

- evidence scoring needs anti-spam and quality controls
- evidence rewards can be farmed if introduced too early
- P0 should prove judgment accuracy before adding evidence rewards

## Force Void

The market should be voided when:

- the data source disappears
- the formula is ambiguous
- project ownership is incorrect
- the milestone no longer matches the submitted project
- settlement cannot be made from available data

