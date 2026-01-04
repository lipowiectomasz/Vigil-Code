<?php

declare(strict_types=1);

namespace App\{Module}\Infrastructure\EventSubscriber;

use App\{Module}\Domain\DataObject\{ClassName};
use Pimcore\Event\DataObjectEvents;
use Pimcore\Event\Model\DataObjectEvent;
use Psr\Log\LoggerInterface;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;

/**
 * {Description of what this subscriber does}
 */
readonly class {ClassName}Subscriber implements EventSubscriberInterface
{
    public function __construct(
        private LoggerInterface $logger,
    ) {
    }

    public static function getSubscribedEvents(): array
    {
        return [
            DataObjectEvents::PRE_ADD => 'onPreAdd',
            DataObjectEvents::PRE_UPDATE => 'onPreUpdate',
            DataObjectEvents::POST_ADD => 'onPostAdd',
            DataObjectEvents::POST_UPDATE => 'onPostUpdate',
            DataObjectEvents::PRE_DELETE => 'onPreDelete',
            DataObjectEvents::POST_DELETE => 'onPostDelete',
        ];
    }

    public function onPreAdd(DataObjectEvent $event): void
    {
        $object = $event->getObject();

        if (!$object instanceof {ClassName}) {
            return;
        }

        if (!\Pimcore::inAdmin()) {
            return;
        }

        // Logic before object creation
    }

    public function onPreUpdate(DataObjectEvent $event): void
    {
        $object = $event->getObject();

        if (!$object instanceof {ClassName}) {
            return;
        }

        if (!\Pimcore::inAdmin()) {
            return;
        }

        // Business logic before update
        $this->logger->info('PIM: {ClassName} updating', [
            'component' => '{ClassName}Subscriber',
            'objectId' => $object->getId(),
        ]);
    }

    public function onPostAdd(DataObjectEvent $event): void
    {
        $object = $event->getObject();

        if (!$object instanceof {ClassName}) {
            return;
        }

        if (!\Pimcore::inAdmin()) {
            return;
        }

        // Logic after object creation
        $this->logger->info('PIM: {ClassName} created', [
            'component' => '{ClassName}Subscriber',
            'objectId' => $object->getId(),
        ]);
    }

    public function onPostUpdate(DataObjectEvent $event): void
    {
        $object = $event->getObject();

        if (!$object instanceof {ClassName}) {
            return;
        }

        if (!\Pimcore::inAdmin()) {
            return;
        }

        // Logic after object update
        $this->logger->info('PIM: {ClassName} updated', [
            'component' => '{ClassName}Subscriber',
            'objectId' => $object->getId(),
        ]);
    }

    public function onPreDelete(DataObjectEvent $event): void
    {
        $object = $event->getObject();

        if (!$object instanceof {ClassName}) {
            return;
        }

        if (!\Pimcore::inAdmin()) {
            return;
        }

        // Logic before object deletion
    }

    public function onPostDelete(DataObjectEvent $event): void
    {
        $object = $event->getObject();

        if (!$object instanceof {ClassName}) {
            return;
        }

        if (!\Pimcore::inAdmin()) {
            return;
        }

        // Logic after object deletion
        $this->logger->info('PIM: {ClassName} deleted', [
            'component' => '{ClassName}Subscriber',
            'objectId' => $object->getId(),
        ]);
    }
}