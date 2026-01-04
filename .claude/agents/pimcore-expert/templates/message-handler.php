<?php

declare(strict_types=1);

namespace App\{Module}\MessageHandler;

use App\{Module}\Infrastructure\Message\{MessageName}Wrapper;
use App\{Module}\Message\{MessageName};
use Psr\Log\LoggerInterface;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

/**
 * {Description of what this handler does}
 */
#[AsMessageHandler]
readonly class {MessageName}Handler
{
    public function __construct(
        private LoggerInterface $logger,
    ) {
    }

    public function __invoke({MessageName}Wrapper $wrapper): void
    {
        $message = $wrapper->message;

        try {
            $this->logger->info('PIM: Processing {MessageName}', [
                'component' => '{MessageName}Handler',
                // Add message properties for logging
            ]);

            // Business logic here

            $this->logger->info('PIM: {MessageName} processed successfully', [
                'component' => '{MessageName}Handler',
            ]);
        } catch (\Exception $e) {
            $this->logger->error('PIM: Failed to process {MessageName}', [
                'component' => '{MessageName}Handler',
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            throw $e; // Re-throw to trigger Messenger retry mechanism
        }
    }
}