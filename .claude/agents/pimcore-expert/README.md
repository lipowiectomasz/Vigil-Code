# Pimcore Expert Agent

## Overview

This agent is a specialized assistant for working with **Pimcore 12.x**, **Symfony 6/7**, and **PHP 8.3+** in the context of the **PSB PIM project**. It understands Domain-Driven Design (DDD) architecture, Pimcore Data Objects, Event-Driven patterns, and the Message/Messenger workflow.

## Quick Start

### Using the Agent

The agent can be invoked via the Task tool in Claude Code:

```
Task(
  prompt="You are pimcore-expert. [your task description]",
  subagent_type="general-purpose"
)
```

Or through the Master Orchestrator:
```
/expert [pimcore-related task]
```

### What This Agent Knows

1. **Pimcore 12.x API**
   - Data Objects (CRUD, Listing API)
   - Event lifecycle (PRE/POST ADD/UPDATE/DELETE)
   - Class override mechanism

2. **Symfony 6/7**
   - Event Dispatcher & EventSubscribers
   - Messenger (AMQP/RabbitMQ)
   - Dependency Injection
   - Service configuration

3. **Project Architecture**
   - DDD structure (Action/Domain/Infrastructure)
   - Repository pattern
   - Message Wrapper pattern
   - Naming conventions

4. **Code Quality**
   - PHPStan Level 6+
   - PHP-CS-Fixer
   - Best practices

## File Structure

```
.claude/agents/pimcore-expert/
├── README.md                           # This file
├── AGENT.md                           # Complete agent knowledge base
├── config.json                        # Agent configuration
└── templates/
    ├── event-subscriber.php           # EventSubscriber template
    ├── message-handler.php            # Message Handler template
    ├── message-wrapper-pattern.php    # Complete Message/Wrapper/Handler
    ├── repository.php                 # Repository implementation
    ├── repository-interface.php       # Repository interface
    └── dataobject-extension.php       # DataObject extension pattern
```

## Common Use Cases

### 1. Send Message to Queue

**Task**: Dispatch asynchronous message for background processing

**Solution**: Use Message/Wrapper/Handler pattern

```php
// 1. Create message (Domain)
$message = new ExportDictionaryValuesToPddMessage($pimId);

// 2. Wrap it (Infrastructure)
$wrapper = new ExportDictionaryValuesToPddMessageWrapper($message);

// 3. Dispatch
$this->messageDispatcherService->dispatchMessage($wrapper);
```

**Template**: `templates/message-wrapper-pattern.php`

---

### 2. Extend DataObject with Custom Logic

**Task**: Add custom methods to auto-generated Pimcore DataObject

**Solution**: Create extension class in `Domain/DataObject/`

```php
// src/Dictionary/Domain/DataObject/Dictionary.php
namespace App\Dictionary\Domain\DataObject;

use Pimcore\Model\DataObject\Dictionary as GeneratedDictionary;

class Dictionary extends GeneratedDictionary
{
    public function getChildren(): array
    {
        $listing = new DictionaryValue\Listing();
        $listing->setCondition('dictionary__id = ?', [$this->getId()]);
        return $listing->load();
    }
}
```

**Template**: `templates/dataobject-extension.php`

---

### 3. Implement Repository Pattern

**Task**: Create repository for database queries

**Solution**: Interface in Domain, Implementation in Infrastructure

```php
// Domain/Repository/DictionaryRepositoryInterface.php
interface DictionaryRepositoryInterface
{
    public function findByPimId(string $pimId): ?Dictionary;
}

// Infrastructure/Repository/DictionaryRepository.php
class DictionaryRepository implements DictionaryRepositoryInterface
{
    public function findByPimId(string $pimId): ?Dictionary
    {
        $listing = new Dictionary\Listing();
        $listing->setCondition('pimId = ?', [$pimId]);
        return $listing->current();
    }
}
```

**Templates**:
- `templates/repository-interface.php`
- `templates/repository.php`

---

## Resources

### Documentation
- **Pimcore Resources**: `.claude/docs/pimcore-resources.md`
- **Agent Knowledge**: `AGENT.md`
- **Official Docs**: https://docs.pimcore.com/platform/Pimcore/Objects/

### Project Modules
- **Dictionary** - Business dictionaries (reference implementation)
- **Product** - Product catalog
- **ProductCategory** - Product categorization
- **Supplier** - Supplier management
- **Brand** - Brand management
- **Classification** - Product classification
- **ProcessManager** - Background jobs
- **ProductAttachment** - File attachments
- **Common** - Shared infrastructure

### Code Quality Tools
```bash
# PHPStan
vendor/bin/phpstan analyse -c phpstan.neon

# PHP-CS-Fixer
vendor/bin/php-cs-fixer fix --using-cache=no

# PHPMD
vendor/bin/phpmd src ansi phpmd.xml
```

## Decision Tree

When working on a task, follow this decision tree:

```
Task received
    ↓
Is it about DataObject CRUD?
    ├─ YES → Use Pimcore Listing API or static methods
    │         Templates: dataobject-extension.php
    │
    └─ NO
        ↓
    Is it about reacting to DataObject changes?
        ├─ YES → Use EventSubscriber with PRE/POST events
        │         Template: event-subscriber.php
        │
        └─ NO
            ↓
        Is it about async processing?
            ├─ YES → Use Message/Wrapper/Handler pattern
            │         Template: message-wrapper-pattern.php
            │
            └─ NO
                ↓
            Is it about database queries?
                ├─ YES → Use Repository pattern
                │         Templates: repository.php, repository-interface.php
                │
                └─ NO → Consult AGENT.md or ask user for clarification
```

## Critical Rules

### ❌ NEVER DO

1. Edit auto-generated files:
   - `var/classes/DataObject/*.php`
   - `var/classes/definition_*.php`

2. Forget `\Pimcore::inAdmin()` check:
   ```php
   if (!\Pimcore::inAdmin()) {
       return; // Prevents infinite loops
   }
   ```

3. Use FQN in use statements:
   ```php
   // ❌ BAD
   new \App\Dictionary\Message\ExportMessage();

   // ✅ GOOD
   use App\Dictionary\Message\ExportMessage;
   new ExportMessage();
   ```

### ✅ ALWAYS DO

1. Use type hints everywhere
2. Use `readonly` for EventSubscribers
3. Validate `instanceof` before casting
4. Log important events with context
5. Wrap exceptions in try-catch

## Examples from Project

### Real Implementation: DictionaryPortalExportSubscriber

**Location**: `src/Dictionary/Infrastructure/EventSubscriber/DictionaryPortalExportSubscriber.php`

**What it does**:
- Listens to `PRE_UPDATE` event on Dictionary objects
- Detects when `isSyncWithSp` field changes
- Triggers export (false → true) or deletion (true → false) of related values

**Key techniques used**:
1. Field change detection in PRE_UPDATE event
2. Message dispatch via `MessageDispatcherService`
3. Comprehensive logging with context

**See the actual file for reference implementation.**

---

## Troubleshooting

### Issue: Changes not saved

**Cause**: Forgot to call `$object->save()`

**Solution**: Always save after modifications
```php
$object->setFieldName('value');
$object->save(); // Don't forget!
```

---

### Issue: Infinite loop in EventSubscriber

**Cause**: Missing `\Pimcore::inAdmin()` check

**Solution**: Add guard clause
```php
if (!\Pimcore::inAdmin()) {
    return; // Prevents loops in async jobs
}
```

---

### Issue: Message not consumed

**Cause**: Handler not registered or wrong wrapper

**Solution**:
1. Check handler has `__invoke()` method
2. Verify routing in `messenger.yaml`
3. Ensure wrapper is dispatched, not raw message

---

## Version History

- **1.0.0** (2025-12-20) - Initial agent creation
  - Complete Pimcore 12.x API knowledge
  - DDD architecture patterns
  - Message/Messenger workflow
  - Code templates for common tasks

---

## Contributing

To improve this agent:

1. **Add new templates** in `templates/` directory
2. **Update AGENT.md** with new patterns or APIs
3. **Add examples** from real project implementations
4. **Update resources** in `.claude/docs/pimcore-resources.md`

---

## License

Internal tool for PSB PIM Project.

---

**Maintained By**: PSB PIM Team
**Last Updated**: 2025-12-20
**Agent Version**: 1.0.0
**Pimcore Version**: 12.x
