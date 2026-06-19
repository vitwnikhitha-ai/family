import express from 'express';
import path from 'path';
import fs from 'fs';
import db from '../utils/db.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * /api/documents:
 *   post:
 *     summary: Upload a family document
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - category
 *               - memberId
 *               - fileBase64
 *             properties:
 *               title:
 *                 type: string
 *               category:
 *                 type: string
 *               memberId:
 *                 type: string
 *               fileBase64:
 *                 type: string
 *               documentMimeType:
 *                 type: string
 *     responses:
 *       201:
 *         description: Document uploaded successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Member not found
 */
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, category, memberId, fileBase64, documentMimeType } = req.body;

    if (!fileBase64) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    if (!title || !category || !memberId) {
      return res.status(400).json({ message: 'Title, category, and memberId are required fields.' });
    }

    // Verify member exists
    const member = await db.Member.findById(memberId);
    if (!member) {
      return res.status(404).json({ message: 'Linked family member not found.' });
    }

    const newDocument = await db.Document.create({
      title,
      category,
      memberId,
      fileUrl: fileBase64,
      fileType: documentMimeType || 'application/octet-stream'
    });

    res.status(201).json(newDocument);
  } catch (error) {
    console.error('Document upload error:', error);
    res.status(500).json({ message: 'Server error uploading document.', error: error.message });
  }
});

/**
 * @swagger
 * /api/documents:
 *   get:
 *     summary: Get all documents, optionally filtered by memberId
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: memberId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of documents
 *       401:
 *         description: Not authorized
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { memberId } = req.query;
    const filter = {};
    if (memberId) {
      filter.memberId = memberId;
    }

    const documents = await db.Document.find(filter);
    
    // Custom populate since mock DB doesn't support complex populate on arrays automatically
    const populatedDocs = [];
    for (const doc of documents) {
      const docObj = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };
      const member = await db.Member.findById(doc.memberId);
      docObj.member = member ? (typeof member.toObject === 'function' ? member.toObject() : member) : null;
      populatedDocs.push(docObj);
    }

    res.json(populatedDocs);
  } catch (error) {
    console.error('Fetch documents error:', error);
    res.status(500).json({ message: 'Server error fetching documents.', error: error.message });
  }
});

/**
 * @swagger
 * /api/documents/{id}:
 *   delete:
 *     summary: Delete a document
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Document deleted successfully
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Document not found
 */
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const docId = req.params.id;
    const document = await db.Document.findById(docId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found.' });
    }

    // If file is stored locally, try to delete it
    if (document.fileUrl.startsWith('/uploads/')) {
      const filename = path.basename(document.fileUrl);
      const localPath = path.resolve('backend/uploads', filename);
      fs.unlink(localPath, (err) => {
        if (err) console.error(`Failed to delete local file ${localPath}:`, err.message);
      });
    }

    await db.Document.findByIdAndDelete(docId);
    res.json({ message: 'Document deleted successfully.' });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ message: 'Server error deleting document.', error: error.message });
  }
});

export default router;
