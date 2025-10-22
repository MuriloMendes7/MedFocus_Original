# Admin Uploader Integration

This document describes the integration of the Admin Uploader functionality into the MedFocus Anki SRS application.

## Overview

The Admin Uploader provides functionality for administrators to:
- Upload flashcard decks from text files
- Upload simulado (quiz) decks from text files
- Edit existing decks and cards
- Manage deck categories and themes

## Files Added/Modified

### New Files
- `admin-uploader.js` - Main uploader functionality
- `admin-editor-styles.css` - Styling for uploader modals
- `services/parserService.js` - Service for parsing uploaded content
- `services/storageService.js` - Service for managing deck storage
- `test-admin-uploader.html` - Test page for functionality verification

### Modified Files
- `index.html` - Added CSS and script links
- `app.js` - Added initialization call for AdminUploader

## File Structure

```
medfocus-anki-srs/
├── index.html
├── app.js
├── admin-uploader.js
├── admin-editor-styles.css
├── services/
│   ├── parserService.js
│   └── storageService.js
├── test-admin-uploader.html
└── README-ADMIN-UPLOADER.md
```

## Usage

### For Administrators

1. **Access Admin Panel**: Log in as an admin user and navigate to the Admin dashboard view.

2. **Upload Flashcards**:
   - Click "Upload Flashcards" button
   - Select a text file with flashcard content
   - Format: `Question|Answer|Explanation` (one per line)
   - Choose category and theme
   - Click "Upload" to save

3. **Upload Simulados**:
   - Click "Upload Simulados" button
   - Select a text file with quiz content
   - Format: `Question|A) Option1|B) Option2|C) Option3|D) Option4|CorrectLetter|Explanation`
   - Choose category and time limit
   - Click "Upload" to save

4. **Edit Decks**:
   - Use the deck editor to modify existing cards
   - Add, edit, or delete individual cards
   - Update deck metadata

### File Format Examples

#### Flashcard File Format
```
Qual é o maior osso do corpo humano?|Fêmur|O fêmur é o osso da coxa, sendo o mais longo e resistente do esqueleto humano.
Quantas câmaras possui o coração humano?|4 câmaras|O coração humano possui 4 câmaras: 2 átrios (direito e esquerdo) e 2 ventrículos (direito e esquerdo).
```

#### Simulado File Format
```
Qual é a função principal do coração?|A) Filtrar sangue|B) Bombear sangue|C) Produzir hemácias|D) Armazenar oxigênio|B|O coração bombeia sangue para todo o corpo através do sistema circulatorio.
Quantas câmaras tem o coração humano?|A) 2|B) 3|C) 4|D) 5|C|O coração tem 4 câmaras: 2 átrios e 2 ventrículos.
```

## Testing

### Test Page
Open `test-admin-uploader.html` in a browser to test individual components:

- **Flashcard Upload Test**: Tests the flashcard upload modal
- **Parser Service Test**: Tests content parsing functionality
- **Simulado Upload Test**: Tests the quiz upload modal
- **Deck Editor Test**: Tests the deck editing functionality
- **Storage Service Test**: Tests deck saving/loading
- **Integration Test**: Tests full system integration

### Manual Testing Steps

1. Open the main application (`index.html`)
2. Log in as admin (admin@medfocus.com / admin123)
3. Navigate to Admin dashboard
4. Test upload functionality with sample files
5. Verify uploaded content appears in flashcards/quizzes sections

## API Reference

### AdminUploader Class

#### Methods
- `initAdminUploadAndEditors()` - Initialize all uploader functionality
- `showFlashcardUploadModal()` - Show flashcard upload modal
- `showSimuladoUploadModal()` - Show quiz upload modal
- `showDeckEditor(deckId)` - Show deck editor for specific deck
- `saveFlashcardDeck()` - Save uploaded flashcard deck
- `saveSimuladoDeck()` - Save uploaded quiz deck

### ParserService Class

#### Methods
- `parseFlashcardContent(content)` - Parse flashcard text content
- `parseSimuladoContent(content)` - Parse quiz text content
- `validateFlashcardFormat(content)` - Validate flashcard format
- `validateSimuladoFormat(content)` - Validate quiz format

### StorageService Class

#### Methods
- `saveDeck(deck)` - Save deck to localStorage
- `loadDecks()` - Load all decks from localStorage
- `updateDeck(deckId, updates)` - Update specific deck
- `deleteDeck(deckId)` - Delete specific deck

## Dependencies

- Modern browser with ES6+ support
- localStorage API for data persistence
- FileReader API for file uploads

## Browser Compatibility

- Chrome 70+
- Firefox 65+
- Safari 12+
- Edge 79+

## Troubleshooting

### Common Issues

1. **Upload button not working**
   - Check browser console for JavaScript errors
   - Ensure all script files are loaded in correct order
   - Verify file format matches expected structure

2. **Modal not appearing**
   - Check that CSS file is loaded
   - Ensure modal container exists in DOM
   - Verify AdminUploader is properly initialized

3. **Parser errors**
   - Check file encoding (should be UTF-8)
   - Verify separator format (| for flashcards, | for options)
   - Ensure minimum required fields are present

### Debug Mode

Enable debug logging by opening browser console and checking for:
- "AdminUploader initialized"
- "ParserService loaded"
- "StorageService loaded"
- Upload progress messages

## Future Enhancements

- Support for CSV file uploads
- Bulk deck operations
- Advanced validation and error reporting
- Progress indicators for large uploads
- Export functionality for decks
- Integration with cloud storage services

## Support

For issues or questions about the Admin Uploader functionality, please check:
1. Browser console for error messages
2. Test page for component verification
3. File format documentation above
4. Code comments in individual service files
