# Библиотека `arkts_formatter`

Эта библиотека предоставляет систему форматирования длинных строк для TypeScript и ArkTS (ETS) кода с использованием расширенного AST-анализа.

## Назначение

- **AST-based форматирование**: Интеллектуальное разбиение длинных строк с учетом синтаксической и семантической структуры кода
- **Поддержка ArkTS/ETS**: Специализированная обработка файлов ArkTS (HarmonyOS)
- **Семантическая эквивалентность**: Гарантия сохранения семантики кода после форматирования
- **Однопроходное форматирование**: Эффективная обработка без перестроения AST
- **Валидация результатов**: Автоматическая проверка синтаксической корректности и семантической эквивалентности

> ⚠️ **Важно.** Эта библиотека является основным движком форматирования для проекта. Она использует расширенный AST (`libs/arkts_enhanced_ast`) для точного анализа структуры кода и определения безопасных точек разбиения строк.

## Архитектура

### Основные компоненты

1. **LineLengthFormatter** - главный класс форматтера
   - Управляет процессом форматирования
   - Координирует работу стратегий и валидаторов
   - Обеспечивает однопроходное форматирование

2. **EnhancedASTFormattingStrategy** - стратегия форматирования на основе расширенного AST
   - Анализирует синтаксическую структуру кода
   - Определяет оптимальные точки разбиения
   - Учитывает приоритеты различных конструкций

3. **ResultValidator** - валидатор результатов
   - Проверяет синтаксическую корректность
   - Валидирует семантическую эквивалентность
   - Обеспечивает откат при ошибках

4. **TransformationManager** - менеджер трансформаций
   - Управляет применением изменений
   - Обрабатывает конфликты позиций
   - Обеспечивает корректное применение переносов

5. **FileTypeDetector** - детектор типов файлов
   - Определяет тип файла (TS/TSX/ArkTS) по расширению (.ts/.tsx/.ets)

### Стратегия паттернов

Библиотека использует паттерн **Strategy** для форматирования:

```typescript
interface FormattingStrategy {
  canHandle(line: string, lineIndex: number, context: FormattingContext): boolean;
  format(line: string, lineIndex: number, context: FormattingContext): FormatterResult;
  getPriority(): number;
}
```

Каждая стратегия оценивает, может ли она обработать строку, и применяет соответствующее форматирование. Стратегии сортируются по приоритету.

## Возможности

### ✅ Поддерживаемые конструкции

- Объявления классов с множественными интерфейсами
- Длинные списки параметров функций
- Объектные литералы
- Массивы
- Деструктуризация (объектов и массивов)
- Union типы
- Импорты
- Логические выражения
- Арифметические выражения
- Цепочки вызовов методов
- JSX/TSX элементы

### 🛡️ Защита от ASI (Automatic Semicolon Insertion)

Форматтер **никогда** не вставляет перенос после:
- `return`
- `throw`
- `break`
- `continue`
- `yield`

Это предотвращает критические ошибки, связанные с автоматической вставкой точек с запятой.

### 🔍 Валидация

Каждый результат форматирования проходит проверку:

1. **Синтаксическая валидация** - код должен парситься без ошибок
2. **Семантическая эквивалентность** - нормализованный код должен быть идентичен оригиналу
3. **Проверка длины строк** - измененные строки должны укладываться в лимит
4. **Проверка регрессий** - изменения не должны ухудшать код

## Использование в коде

### Базовое использование

```typescript
import { LineLengthFormatter } from 'libs/arkts_formatter';
import type { LineLengthConfig } from 'libs/arkts_formatter';

// Конфигурация форматтера
const formatterConfig = {
  tabSize: 2,
  useTabs: false,
  quoteStyle: 'single',
  semicolons: true,
  trailingCommas: false,
  maxLineLength: 80
};

// Конфигурация проверки длины строк
const lineLengthConfig: LineLengthConfig = {
  maxLineLength: 80,
  ignoreUrls: false,
  ignoreStrings: false,
  ignoreComments: false,
  ignoreTemplateLiterals: true
};

const formatter = new LineLengthFormatter(formatterConfig, lineLengthConfig);

// Форматирование кода (вариант 1: по пути)
const formattedByPath = formatter.format(sourceCode, 'file.ts');

// Форматирование кода (вариант 2: без пути, но с явным типом)
const formattedByType = formatter.format(sourceCode, ContentType.TS);
```

### Использование утилит

```typescript
import { 
  getLineInfo,
  isNodeLong,
  containsUrl,
  isComment,
  ResultValidator 
} from 'libs/arkts_formatter';

// Анализ строки
const lineInfo = getLineInfo(line, 0, 80);
console.log(`Строка превышает лимит: ${lineInfo.exceedsLimit}`);

// Проверка URL
if (containsUrl(line)) {
  // Пропускаем форматирование строк с URL
}

// Валидация результата
const validation = ResultValidator.validate(
  originalCode,
  formattedCode,
  context,
  'file.ts'
);

if (validation.isValid) {
  console.log('Форматирование прошло валидацию');
}
```

### Работа с типами файлов

```typescript
import { FileTypeDetector, FileType } from 'libs/arkts_formatter';

const fileType = FileTypeDetector.detectFileType('MyComponent.ets');

if (fileType === ContentType.ARKTS) {
  console.log('Обнаружен файл ArkTS');
}
```

## Тестирование

### Структура тестов

Тесты находятся в директории `tests/`:

```
libs/arkts_formatter/tests/
├── line-length-formatter.test.ts         # Основные тесты форматтера
├── expression-normalizer/                # Тесты нормализатора выражений
│   ├── normalizer-fixtures.test.ts
│   └── fixtures/
│       └── pairs.json
├── example-fixture-usage.test.ts         # Примеры использования фикстур
└── fixtures/                             # Тестовые фикстуры
    └── fixtures/
        ├── *.json                        # JSON-файлы с тест-кейсами
        ├── README.md
        └── USAGE_RU.md
```

### Быстрый запуск

Запустить только тесты этой библиотеки:

```bash
# Из корня проекта
npm test libs/arkts_formatter/tests

# Или запустить все unit-тесты
npm run test:unit
```

### Структура фикстур

Фикстуры представлены в JSON-формате:

```json
{
  "equivalent": [
    {
      "description": "Описание теста",
      "original": "исходный код",
      "expected": "ожидаемый результат"
    }
  ],
  "notEquivalent": [
    {
      "description": "Негативный тест",
      "original": "исходный код",
      "expected": "ожидаемый результат (не должен совпадать)"
    }
  ]
}
```

## Конфигурация

### FormatterConfig

Основная конфигурация форматтера:

```typescript
interface FormatterConfig {
  tabSize: number;              // Размер табуляции (обычно 2 или 4)
  useTabs: boolean;             // Использовать табы вместо пробелов
  quoteStyle: 'single' | 'double';  // Стиль кавычек
  semicolons: boolean;          // Требовать точки с запятой
  trailingCommas: boolean;      // Завершающие запятые
  maxLineLength: number;        // Максимальная длина строки
}
```

### LineLengthConfig

Специфическая конфигурация для проверки длины строк:

```typescript
interface LineLengthConfig {
  maxLineLength: number;           // Максимальная длина строки
  ignoreUrls: boolean;             // Игнорировать строки с URL
  ignoreStrings: boolean;          // Игнорировать строковые литералы
  ignoreComments: boolean;         // Игнорировать комментарии
  ignoreTemplateLiterals: boolean; // Игнорировать template literals
}
```

## Экспортируемые типы и функции

### Основные классы

- `LineLengthFormatter` - главный класс форматтера
- `EnhancedASTFormattingStrategy` - AST-стратегия форматирования
- `ResultValidator` - валидатор результатов
- `TransformationManager` - менеджер трансформаций
- `FileTypeDetector` - детектор типов файлов

### Типы

- `FormattingContext` - контекст форматирования
- `FormatterResult` - результат форматирования
- `FormattingStrategy` - интерфейс стратегии
- `TransformationResult` - результат трансформации
- `LineBreakInsertion` - информация о переносе строки
- `ValidationResult` - результат валидации
- `ValidationIssue` - проблема валидации

### Утилиты

- `getLineInfo()` - получить информацию о строке
- `getIndent()` - получить отступ строки
- `getIndentUnit()` - получить единицу отступа
- `getIndentForNode()` - получить отступ для узла AST
- `extractLineForNode()` - извлечь строку для узла
- `isNodeLong()` - проверить, длинный ли узел
- `splitByTopLevelCommas()` - разбить по запятым верхнего уровня
- `containsUrl()` - проверить наличие URL
- `isComment()` - проверить, является ли строка комментарием

## Ограничения

- **Template literals**: Не форматируются для сохранения семантики (пробелы значимы)
- **Комментарии**: Обрабатываются консервативно, чтобы избежать потери информации
- **Регулярные выражения**: Не модифицируются
- **Строки с URL**: Могут быть проигнорированы в зависимости от конфигурации

## Зависимости

Библиотека зависит от:

- `libs/arkts_enhanced_ast` - расширенный AST с координатами и токенами
- `typescript` - компилятор TypeScript для парсинга

## Интеграция

Библиотека интегрирована в основной проект `codecheck_fixer` и используется для:

1. Форматирования длинных строк в процессе статического анализа
2. Автоматического исправления нарушений длины строк
3. Обеспечения соответствия кодовым стандартам CI/CD

## Разработка

### Добавление новой стратегии

1. Создайте класс, реализующий `FormattingStrategy`
2. Определите логику в методах `canHandle()` и `format()`
3. Установите приоритет в `getPriority()`
4. Добавьте стратегию в конструктор `LineLengthFormatter`

```typescript
export class MyFormattingStrategy implements FormattingStrategy {
  canHandle(line: string, lineIndex: number, context: FormattingContext): boolean {
    // Логика проверки
    return true;
  }

  format(line: string, lineIndex: number, context: FormattingContext): FormatterResult {
    // Логика форматирования
    return {
      lineBreaks: [...],
      success: true
    };
  }

  getPriority(): number {
    return 100; // Приоритет
  }
}
```

### Отладка

Для отладки работы форматтера используйте:

```typescript
// Включить подробный вывод
const formatter = new LineLengthFormatter(formatterConfig, lineLengthConfig);

// Форматировать с указанием пути (для лучшей диагностики)
const result = formatter.format(code, 'debug.ts');
```

## Roadmap

- [ ] Добавление кэширования результатов AST-анализа
- [ ] Оптимизация производительности для больших файлов
- [ ] Поддержка пользовательских правил форматирования
- [ ] Интеграция с LSP для real-time форматирования
- [ ] Расширенная поддержка JSX/TSX

## Смотрите также

- [libs/arkts_enhanced_ast](../arkts_enhanced_ast/README.md) - расширенный AST
- [libs/prettier_formatter](../prettier_formatter/README_RU.md) - альтернативный форматтер
- [docs/enhanced-ast-building-process_RU.md](../../docs/enhanced-ast-building-process_RU.md) - процесс построения AST

