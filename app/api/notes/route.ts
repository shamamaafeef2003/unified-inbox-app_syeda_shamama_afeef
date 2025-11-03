import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const noteSchema = z.object({
  contactId: z.string(),
  userId: z.string(),
  content: z.string().min(1),
  isPrivate: z.boolean().default(false),
});

/**
 * GET /api/notes?contactId=xxx - Fetch notes for a contact
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const contactId = searchParams.get('contactId');
    const userId = searchParams.get('userId');

    if (!contactId) {
      return NextResponse.json(
        { error: 'contactId is required' },
        { status: 400 }
      );
    }

    const where: any = { contactId };
    
    // If userId provided, show private notes only for that user
    if (userId) {
      where.OR = [
        { isPrivate: false },
        { isPrivate: true, userId }
      ];
    } else {
      where.isPrivate = false;
    }

    const notes = await prisma.note.findMany({
      where,
      include: {
        user: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(notes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notes' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notes - Create a new note
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = noteSchema.parse(body);

    const note = await prisma.note.create({
      data: validated,
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    });

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid note data', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating note:', error);
    return NextResponse.json(
      { error: 'Failed to create note' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/notes?id=xxx - Delete a note
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'note id is required' },
        { status: 400 }
      );
    }

    await prisma.note.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting note:', error);
    return NextResponse.json(
      { error: 'Failed to delete note' },
      { status: 500 }
    );
  }
}