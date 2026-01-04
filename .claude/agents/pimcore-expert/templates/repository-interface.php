<?php

declare(strict_types=1);

namespace App\{Module}\Domain\Repository;

use App\{Module}\Domain\DataObject\{ClassName};

/**
 * {ClassName} repository interface
 */
interface {ClassName}RepositoryInterface
{
    public function findById(int $id): ?{ClassName};

    public function findByPimId(string $pimId): ?{ClassName};

    /**
     * @return {ClassName}[]
     */
    public function findAll(): array;

    /**
     * @return {ClassName}[]
     */
    public function findByCondition(string $condition, array $params = []): array;

    public function findOneByCondition(string $condition, array $params = []): ?{ClassName};

    public function count(): int;

    public function countByCondition(string $condition, array $params = []): int;

    public function save({ClassName} $object): void;

    public function delete({ClassName} $object): void;
}