<?php

/**
 * Complete Message/Wrapper/Handler Pattern Template
 *
 * This template shows the complete flow for implementing
 * asynchronous message processing using Symfony Messenger.
 */

// ============================================================
// 1. Pure Message (Domain Layer)
// File: src/{Module}/Message/{MessageName}.php
// ============================================================

declare(strict_types=1);

namespace App\{Module}\Message;

/**
 * {Description of what this message represents}
 */
class {MessageName}
{
    public function __construct(
        public string $pimId,
        // Add other properties as needed
    ) {
    }
}

// ============================================================
// 2. Message Wrapper (Infrastructure Layer)
// File: src/{Module}/Infrastructure/Message/{MessageName}Wrapper.php
// ============================================================

declare(strict_types=1);

namespace App\{Module}\Infrastructure\Message;

use App\{Module}\Message\{MessageName};

/**
 * Infrastructure wrapper for {MessageName}
 */
class {MessageName}Wrapper
{
    public function __construct(
        public {MessageName} $message
    ) {
    }
}

// ============================================================
// 3. Message Handler (Application Layer)
// File: src/{Module}/MessageHandler/{MessageName}Handler.php
// ============================================================

declare(strict_types=1);

namespace App\{Module}\MessageHandler;

use App\{Module}\Infrastructure\Message\{MessageName}Wrapper;
use Psr\Log\LoggerInterface;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler]
readonly class {MessageName}Handler
{
    public function __construct(
        private LoggerInterface $logger,
        // Inject dependencies
    ) {
    }

    public function __invoke({MessageName}Wrapper $wrapper): void
    {
        $message = $wrapper->message;

        try {
            $this->logger->info('PIM: Processing {MessageName}', [
                'component' => '{MessageName}Handler',
                'pimId' => $message->pimId,
            ]);

            // Business logic here

            $this->logger->info('PIM: {MessageName} processed', [
                'component' => '{MessageName}Handler',
                'pimId' => $message->pimId,
            ]);
        } catch (\Exception $e) {
            $this->logger->error('PIM: Failed to process {MessageName}', [
                'component' => '{MessageName}Handler',
                'pimId' => $message->pimId,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }
}

// ============================================================
// 4. Messenger Configuration
// File: config/packages/messenger.yaml
// ============================================================

/*
framework:
    messenger:
        transports:
            your_queue:
                dsn: '%env(MESSENGER_TRANSPORT_DSN)%'
                retry_strategy:
                    max_retries: 3
                    delay: 1000
                    multiplier: 2

        routing:
            'App\{Module}\Infrastructure\Message\{MessageName}Wrapper': your_queue
*/

// ============================================================
// 5. Dispatching the Message
// File: src/{Module}/Infrastructure/EventSubscriber/SomeSubscriber.php
// ============================================================

declare(strict_types=1);

namespace App\{Module}\Infrastructure\EventSubscriber;

use App\Common\Infrastructure\Service\MessageDispatcherService;
use App\{Module}\Infrastructure\Message\{MessageName}Wrapper;
use App\{Module}\Message\{MessageName};

readonly class SomeSubscriber
{
    public function __construct(
        private MessageDispatcherService $messageDispatcherService,
    ) {
    }

    private function dispatchMessage(string $pimId): void
    {
        $message = new {MessageName}($pimId);
        $wrapper = new {MessageName}Wrapper($message);

        $this->messageDispatcherService->dispatchMessage($wrapper);
    }
}

// ============================================================
// 6. Service Configuration (if needed)
// File: config/services/{module}.yaml
// ============================================================

/*
services:
    App\{Module}\MessageHandler\{MessageName}Handler:
        autowire: true
        autoconfigure: true
        tags:
            - { name: messenger.message_handler }

    App\{Module}\Infrastructure\EventSubscriber\SomeSubscriber:
        autowire: true
        autoconfigure: true
        tags:
            - { name: kernel.event_subscriber }
*/