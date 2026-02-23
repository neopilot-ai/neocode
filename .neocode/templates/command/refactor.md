---
name: refactor
description: Refactor code for better structure and maintainability
---

## Usage
Use this command when you need to improve code organization, readability, or maintainability without changing functionality.

## Implementation
Follow this systematic refactoring process:

1. **Analyze Current Code**
   - Identify code smells and anti-patterns
   - Look for duplicated code
   - Check for overly complex functions
   - Assess naming and structure

2. **Plan Refactoring Strategy**
   - Prioritize changes by impact
   - Ensure tests exist (create if needed)
   - Plan incremental changes
   - Define success criteria

3. **Execute Refactoring**
   - Start with the highest impact changes
   - Make small, focused changes
   - Run tests after each change
   - Update documentation as needed

4. **Validate Results**
   - Ensure functionality is preserved
   - Check performance impact
   - Verify code quality improvements
   - Get code review if possible

## Common Refactoring Patterns

### Extract Method
- Break down large functions into smaller, focused ones
- Give each function a single responsibility
- Use descriptive names

### Extract Class/Module
- Group related functionality
- Reduce coupling between components
- Improve cohesion

### Rename Variables/Functions
- Use clear, descriptive names
- Follow naming conventions
- Avoid abbreviations

### Remove Duplication
- Identify repeated code patterns
- Extract common functionality
- Use helper functions or classes

## Examples
- Refactoring a 100-line function into multiple smaller functions
- Extracting a utility class from scattered helper functions
- Improving variable names for better readability
- Removing duplicated validation logic
