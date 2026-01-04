<?php

declare(strict_types=1);

namespace App\{Module}\Infrastructure\Repository;

use App\{Module}\Domain\DataObject\{ClassName};
use App\{Module}\Domain\Repository\{ClassName}RepositoryInterface;

/**
 * {ClassName} repository implementation using Pimcore Listing API
 */
class {ClassName}Repository implements {ClassName}RepositoryInterface
{
    public function findById(int $id): ?{ClassName}
    {
        return {ClassName}::getById($id);
    }

    public function findByPimId(string $pimId): ?{ClassName}
    {
        $listing = new {ClassName}\Listing();
        $listing->setCondition('pimId = ?', [$pimId]);

        return $listing->current();
    }

    public function findAll(): array
    {
        $listing = new {ClassName}\Listing();
        $listing->setOrderKey('name');
        $listing->setOrder('ASC');

        return $listing->load();
    }

    public function findByCondition(string $condition, array $params = []): array
    {
        $listing = new {ClassName}\Listing();
        $listing->setCondition($condition, $params);

        return $listing->load();
    }

    public function findOneByCondition(string $condition, array $params = []): ?{ClassName}
    {
        $listing = new {ClassName}\Listing();
        $listing->setCondition($condition, $params);
        $listing->setLimit(1);

        return $listing->current();
    }

    public function count(): int
    {
        $listing = new {ClassName}\Listing();

        return $listing->getTotalCount();
    }

    public function countByCondition(string $condition, array $params = []): int
    {
        $listing = new {ClassName}\Listing();
        $listing->setCondition($condition, $params);

        return $listing->getTotalCount();
    }

    public function save({ClassName} $object): void
    {
        $object->save();
    }

    public function delete({ClassName} $object): void
    {
        $object->delete();
    }
}