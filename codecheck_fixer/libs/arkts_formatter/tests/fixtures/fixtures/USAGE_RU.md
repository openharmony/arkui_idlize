# Фикстуры для Тестирования Форматирования

В директории `tests/unittests/fixtures/` созданы фикстуры для всех типов форматирования кода.

## Список Фикстур

### Базовые Конструкции
1. **`function-call.ts`** - Вызовы функций
   - Множество аргументов
   - Вложенные вызовы
   - Method chaining
   - Объекты в аргументах

2. **`object-literal.ts`** - Объектные литералы
   - Простые объекты
   - Вложенные объекты
   - Методы в объектах
   - Computed properties
   - Spread оператор

3. **`array-literal.ts`** - Массивы
   - Простые массивы
   - Массивы объектов
   - Вложенные массивы
   - Spread оператор
   - Массивы с вызовами функций

4. **`assignment.ts`** - Присваивания
   - Простые присваивания
   - Деструктуризация объектов
   - Деструктуризация с переименованием
   - Деструктуризация массивов
   - Множественные присваивания
   - Вычисления

### TypeScript-Специфичные
5. **`union-type.ts`** - Union типы
   - Простые union типы
   - Union с объектными типами
   - Параметры с union типами
   - Generic union типы
   - Intersection + Union

6. **`type-assertion.ts`** - Type assertions
   - As-style assertions
   - Angle-bracket style
   - Generic assertions
   - Двойные assertions
   - Satisfies operator

7. **`import.ts`** - Import statements
   - Named imports
   - Mixed imports (default + named)
   - Type imports
   - Import с alias
   - Dynamic imports
   - Re-exports

8. **`class-declaration.ts`** - Объявления классов
   - Множественное наследование (implements)
   - Generic параметры
   - Абстрактные классы
   - Декораторы
   - Экспортируемые классы
   - Constructor signature

### Выражения
9. **`logical-expression.ts`** - Логические выражения
   - AND операторы
   - OR операторы
   - Смешанные AND/OR
   - Nullish coalescing
   - Тернарный оператор
   - Сложные условия в return

10. **`for-loop.ts`** - Циклы for
    - Классический for
    - For-in с деструктуризацией
    - For-of с фильтрацией
    - Множественные переменные
    - Вложенные вызовы
    - For await...of

### Критические Случаи (ASI)
11. **`return-statement.ts`** - Return statements
    - **КРИТИЧНО**: НЕ разрывать после `return`
    - Return с объектом
    - Return с выражением
    - Return с вызовом функции
    - Return с массивом
    - Return с тернарным оператором

12. **`throw-statement.ts`** - Throw statements
    - **КРИТИЧНО**: НЕ разрывать после `throw`
    - Throw с new Error
    - Throw с кастомной ошибкой
    - Throw с объектом
    - Throw с тернарным оператором
    - Throw с вызовом функции

13. **`template-literal.ts`** - Template literals
    - **КРИТИЧНО**: НЕ ФОРМАТИРОВАТЬ вообще
    - Простые template literals
    - Template literals с выражениями
    - Tagged templates
    - Многострочные templates
    - Вложенные выражения
    - Styled components

### Документация
14. **`comment.ts`** - Комментарии
    - Однострочные комментарии
    - Блочные комментарии
    - JSDoc комментарии
    - Многострочные комментарии
    - Комментарии с кодом
    - TODO комментарии

### UI Frameworks
15. **`jsx-tsx.tsx`** - JSX/TSX элементы
    - JSX с множеством props
    - JSX с children
    - Spread props
    - Условный рендеринг
    - Inline стили
    - JSX фрагменты

## Структура Фикстур

Каждая фикстура содержит пары:
```typescript
const original = `...`; // Код, превышающий лимит строки
const expected = `...`; // Правильно отформатированный код
```

Множество сценариев на конструкцию:
- `original`, `expected` - базовый случай
- `nestedOriginal`, `nestedExpected` - вложенные случаи
- `complexOriginal`, `complexExpected` - сложные случаи
- и т.д.

## Использование

### Импорт всех фикстур
```typescript
import * as Fixtures from './fixtures';

// Использование
const { original, expected } = Fixtures.FunctionCall;
```

### Импорт конкретной фикстуры
```typescript
import { original, expected } from './fixtures/function-call';
```

### Доступ по категориям
```typescript
import { fixtures, categories } from './fixtures';

// Все базовые конструкции
const basicFixtures = fixtures.basic;

// Все критические случаи
const criticalFixtures = fixtures.critical;
```

## Пример Теста

См. `example-fixture-usage.test.ts` для полного примера использования.

```typescript
import * as Fixtures from './fixtures';
import { LineLengthFormatter } from '../../src/formatters/line-length-formatter';

it('should format function calls correctly', () => {
  const { original, expected } = Fixtures.FunctionCall;
  const result = formatter.format(original);
  expect(result).toBe(expected);
});
```

## Важные Замечания

### ASI (Automatic Semicolon Insertion)

**НИКОГДА не разрывать строку сразу после:**
- `return` - `return\n{ }` → `return; { }` (вернёт `undefined`)
- `throw` - `throw\nError()` → `throw; Error()` (не выбросит ошибку)

**Правильный подход:** Разрывать ВНУТРИ выражения, НЕ между ключевым словом и выражением.

### Template Literals

**НИКОГДА не форматировать template literals:**
- Любой пробел внутри `${}` становится частью строки
- Переносы меняют runtime значение
- Отступы сохраняются в выводе

### Сохранение Семантики

Всё форматирование ДОЛЖНО сохранять семантическую эквивалентность:
- Нормализация whitespace: newlines → пустая строка, spaces → один пробел (где нужно)
- Никаких изменений в структуре AST
- Никаких изменений в runtime поведении

## Добавление Новых Фикстур

При добавлении новых фикстур:
1. Включайте понятные комментарии, объясняющие сценарий
2. Отмечайте критические случаи (ASI, templates) явно
3. Предоставляйте простые и сложные примеры
4. Тестируйте граничные случаи
5. Проверяйте семантическую эквивалентность после форматирования
6. Добавьте экспорт в `index.ts`

