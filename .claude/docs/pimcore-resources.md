# Pimcore Documentation Resources

## Project Configuration
- **Pimcore Version**: 12.x (from composer.json: `^12.0`)
- **Symfony Version**: 6.2+ or 7.2+
- **PHP Version**: 8.3.x or 8.4.x
- **Platform Version**: ^2025.3

## Official Documentation

### Core Documentation
- **Main Docs**: https://docs.pimcore.com/platform/
- **Upgrade Notes**: https://pimcore.com/docs/platform/Pimcore/Installation_and_Upgrade/Upgrade_Notes/

### Data Objects
- **Objects Overview**: https://docs.pimcore.com/platform/Pimcore/Objects/
- **Working with PHP API**: https://docs.pimcore.com/platform/2024.2/Pimcore/Objects/Working_with_PHP_API/
- **Object Classes**: https://docs.pimcore.com/platform/Pimcore/Objects/Object_Classes/Data_Types/
- **DataObject Queries**: https://docs.pimcore.com/platform/Datahub/GraphQL/Query/DataObject_Queries/

### Data Types
- **Relational Datatypes**: https://docs.pimcore.com/platform/2024.4/Pimcore/Objects/Object_Classes/Data_Types/Relation_Types/
- **Fieldcollections**: https://docs.pimcore.com/platform/Pimcore/Objects/Object_Classes/Data_Types/Fieldcollections/

### Advanced Topics
- **Database Model**: https://pimcore.com/docs/platform/Pimcore/Development_Tools_and_Details/Database_Model/
- **Data Inheritance**: https://pimcore.com/docs/pimcore/current/Development_Documentation/Objects/Object_Classes/Class_Settings/Inheritance.html

## Critical API Information

### Event Lifecycle

```
DataObjectEvents::PRE_ADD        # Only on creation
DataObjectEvents::PRE_UPDATE     # Only on update
    ↓
SAVE (database write)
    ↓
DataObjectEvents::POST_ADD       # Only on creation
DataObjectEvents::POST_UPDATE    # Only on update
DataObjectEvents::POST_DELETE    # After deletion
```

**Event Usage:**
```php
use Pimcore\Event\DataObjectEvents;
use Pimcore\Event\Model\DataObjectEvent;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;

readonly class MySubscriber implements EventSubscriberInterface
{
    public static function getSubscribedEvents(): array
    {
        return [
            DataObjectEvents::PRE_UPDATE => 'onPreUpdate',
            DataObjectEvents::POST_UPDATE => 'onPostUpdate',
        ];
    }

    public function onPreUpdate(DataObjectEvent $event): void
    {
        $object = $event->getObject();
        // Business logic here
    }
}
```

### Class Override Mechanism

**Auto-generated classes (DO NOT EDIT):**
- `var/classes/DataObject/ClassName.php` - Base class
- `var/classes/definition_ClassName.php` - Class definition

**Custom extensions (EDIT THESE):**
```php
// src/{Module}/Domain/DataObject/ClassName.php
namespace App\Dictionary\Domain\DataObject;

use Pimcore\Model\DataObject\Dictionary as GeneratedDictionary;

class Dictionary extends GeneratedDictionary
{
    public function getValues(): array
    {
        // Custom business logic
    }
}
```

Pimcore automatically uses custom class if it exists in `App\{Module}\Domain\DataObject\` namespace.

### Listing API

```php
use Pimcore\Model\DataObject\Dictionary;

$listing = new Dictionary\Listing();

// Conditions (SQL-like)
$listing->setCondition('pimId = ?', ['PIM-DICT-123']);
$listing->setCondition('name LIKE ?', ['%test%']);

// Ordering
$listing->setOrderKey('name');
$listing->setOrder('ASC');

// Pagination
$listing->setLimit(10);
$listing->setOffset(20);

// Execute
$objects = $listing->load(); // array of objects
$first = $listing->current(); // first object or null
$count = $listing->getTotalCount(); // total count
```

### Static Methods

```php
// Get by ID
$object = Dictionary::getById(123);

// Get by path
$object = Dictionary::getByPath('/dictionaries/my-dict');

// Create new
$object = new Dictionary();
$object->setParent(Service::createFolderByPath('/dictionaries'));
$object->setKey('my-dict');
$object->setPublished(true);
$object->save();

// Delete
$object->delete();
```

## Project Patterns

### DDD Architecture
```
src/
├── {Module}/
│   ├── Action/                    # Use Cases (Application Layer)
│   ├── Domain/
│   │   ├── DataObject/           # Pimcore Entity Extensions
│   │   ├── Repository/           # Repository Interfaces
│   │   └── Service/              # Domain Services
│   ├── Infrastructure/
│   │   ├── EventSubscriber/      # Pimcore Event Listeners
│   │   ├── Message/              # Message Wrappers
│   │   ├── Repository/           # Repository Implementations
│   │   └── OptionProvider/       # Select Options
│   ├── Message/                  # CQRS Messages
│   ├── MessageHandler/           # Messenger Handlers
│   └── Service/                  # Application Services
```

### Naming Conventions

| Type | Suffix | Example | Layer |
|------|--------|---------|-------|
| Use Case | `Action` | `HandleDictionarySyncChangeAction` | Application |
| Event Subscriber | `Subscriber` | `DictionaryPortalExportSubscriber` | Infrastructure |
| Message Handler | `MessageHandler` | `DictionaryUpsertMessageHandler` | Application |
| Message Wrapper | `MessageWrapper` | `ExportDictionaryValuesToPddMessageWrapper` | Infrastructure |
| Domain Service | `Service` | `DictionaryValueService` | Domain |
| Repository Interface | `RepositoryInterface` | `DictionaryRepositoryInterface` | Domain |
| Repository Impl | `Repository` | `DictionaryRepository` | Infrastructure |
| Payload Builder | `PayloadBuilder` | `DictionaryExportPayloadBuilder` | Application |
| Option Provider | `OptionProvider` | `DictionaryValueOptionProvider` | Infrastructure |

### Message Wrapper Pattern

```php
// Pure message (Domain)
namespace App\Dictionary\Message;

class ExportDictionaryValuesToPddMessage
{
    public function __construct(
        public string $dictionaryPimId
    ) {}
}

// Infrastructure wrapper
namespace App\Dictionary\Infrastructure\Message;

class ExportDictionaryValuesToPddMessageWrapper
{
    public function __construct(
        public ExportDictionaryValuesToPddMessage $message
    ) {}
}

// Handler
namespace App\Dictionary\MessageHandler;

class ExportDictionaryValuesToPddMessageHandler
{
    public function __invoke(
        ExportDictionaryValuesToPddMessageWrapper $wrapper
    ): void {
        $message = $wrapper->message;
        // Handle...
    }
}
```

## Common Modules in Project

- **Dictionary** - Business dictionaries
- **Product** - Product catalog
- **ProductCategory** - Product categorization
- **Supplier** - Supplier management
- **Brand** - Brand management
- **Classification** - Product classification
- **ProcessManager** - Background job management
- **ProductAttachment** - Product file attachments
- **Common** - Shared infrastructure components

## Development Tools

### Code Quality
```bash
# PHPStan
vendor/bin/phpstan analyse -c phpstan.neon

# PHP-CS-Fixer
vendor/bin/php-cs-fixer fix --using-cache=no

# PHPMD
vendor/bin/phpmd src ansi phpmd.xml
```

### Pimcore Console
```bash
# Cache clear
bin/console cache:clear

# Class definition rebuild
bin/console pimcore:deployment:classes-rebuild

# Search index rebuild
bin/console pimcore:search-backend-reindex

# Migrations
bin/console doctrine:migrations:migrate
```

## GitHub & Community
- **GitHub**: https://github.com/pimcore/pimcore
- **Discussions**: https://github.com/pimcore/pimcore/discussions
- **Issues**: https://github.com/pimcore/pimcore/issues

## Version-Specific Notes

### Pimcore 12.x Breaking Changes
1. ❌ Removed `o_` prefix from DataObject properties and columns
2. ✅ Properties only update when using `setProperties()`/`setProperty()`

### Migration from 11.x to 12.x
- Review all direct database queries (column names changed)
- Check custom repositories for `o_` prefix usage
- Test Listing API conditions (field names changed)

---

**Last Updated**: 2025-12-20
**Maintained For**: PSB PIM Project
**Pimcore Version**: 12.x