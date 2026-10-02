import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const opponentId = searchParams.get("opponentId");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId parameter" }, { status: 400 });
    }

    // Verify current user role
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true }
    });

    if (!currentUser) {
      // Stale/unknown session (e.g. after a DB reseed): return an empty thread
      // instead of 404 so the polling chat widget doesn't spam the console.
      // The client clears the stale session and redirects to login.
      return NextResponse.json([]);
    }

    const isAdmin = currentUser.role === "ADMIN" || currentUser.role === "SUPERUSER";

    // Fetch all admin/superuser IDs upfront (avoids unsupported nested relation filters)
    const admins = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "SUPERUSER"] } },
      select: { id: true }
    });
    const adminIds = admins.map((a: { id: string }) => a.id);

    if (!isAdmin) {
      // For regular customer: get messages sent to or received from any admin
      const messages = await prisma.chatMessage.findMany({
        where: {
          OR: [
            { senderId: userId, receiverId: { in: adminIds } },
            { senderId: { in: adminIds }, receiverId: userId }
          ]
        },
        orderBy: { createdAt: "asc" }
      });

      // Mark admin → customer messages as read
      await prisma.chatMessage.updateMany({
        where: {
          senderId: { in: adminIds },
          receiverId: userId,
          isRead: false
        },
        data: { isRead: true }
      });

      return NextResponse.json(messages);
    } else {
      // For Admin/Superuser
      if (opponentId) {
        // Fetch chat with a specific customer
        const messages = await prisma.chatMessage.findMany({
          where: {
            OR: [
              { senderId: opponentId, receiverId: { in: adminIds } },
              { senderId: { in: adminIds }, receiverId: opponentId }
            ]
          },
          orderBy: { createdAt: "asc" }
        });

        // Mark customer → admin messages as read
        await prisma.chatMessage.updateMany({
          where: {
            senderId: opponentId,
            receiverId: { in: adminIds },
            isRead: false
          },
          data: { isRead: true }
        });

        return NextResponse.json(messages);
      } else {
        // Get all messages to build thread list, include sender/receiver info
        const allMessages = await prisma.chatMessage.findMany({
          include: {
            sender: { select: { id: true, name: true, role: true, email: true } },
            receiver: { select: { id: true, name: true, role: true, email: true } }
          },
          orderBy: { createdAt: "desc" }
        });

        const threadsMap = new Map<string, any>();
        for (const msg of allMessages) {
          const isSenderUser = msg.sender.role === "USER";
          const threadUser = isSenderUser ? msg.sender : msg.receiver;

          if (threadUser.role !== "USER") continue;

          if (!threadsMap.has(threadUser.id)) {
            threadsMap.set(threadUser.id, {
              userId: threadUser.id,
              userName: threadUser.name,
              userEmail: threadUser.email,
              lastMessage: msg.content,
              lastMessageTime: msg.createdAt,
              unreadCount: 0
            });
          }

          if (!msg.isRead && isSenderUser) {
            threadsMap.get(threadUser.id).unreadCount += 1;
          }
        }

        const threads = Array.from(threadsMap.values());
        return NextResponse.json(threads);
      }
    }
  } catch (error) {
    console.error("Error in chat GET:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { senderId, receiverId, content } = data;

    if (!senderId || !content) {
      return NextResponse.json({ error: "Missing senderId or content" }, { status: 400 });
    }

    // Verify sender
    const sender = await prisma.user.findUnique({
      where: { id: senderId },
      select: { id: true, role: true }
    });

    if (!sender) {
      return NextResponse.json({ error: "Sender not found" }, { status: 404 });
    }

    const isSenderAdmin = sender.role === "ADMIN" || sender.role === "SUPERUSER";
    let targetReceiverId = receiverId;

    if (!isSenderAdmin) {
      // Customer sending: auto-route to first available admin
      const firstAdmin = await prisma.user.findFirst({
        where: { role: { in: ["ADMIN", "SUPERUSER"] } },
        select: { id: true }
      });

      if (!firstAdmin) {
        return NextResponse.json({ error: "No admin account available" }, { status: 500 });
      }

      targetReceiverId = firstAdmin.id;
    } else {
      // Admin is sending: must specify a valid customer receiverId
      if (!receiverId) {
        return NextResponse.json({ error: "Missing receiverId for admin reply" }, { status: 400 });
      }
    }

    const message = await prisma.chatMessage.create({
      data: {
        senderId,
        receiverId: targetReceiverId,
        content
      }
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error("Error in chat POST:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
