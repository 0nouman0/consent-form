import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  return NextResponse.json(
    {
      error: "Not Found",
      message: `API endpoint '${req.nextUrl.pathname}' does not exist.`,
      status: 404,
    },
    { status: 404 }
  );
}

export async function POST(req: NextRequest) {
  return NextResponse.json(
    {
      error: "Not Found",
      message: `API endpoint '${req.nextUrl.pathname}' does not exist.`,
      status: 404,
    },
    { status: 404 }
  );
}

export async function PUT(req: NextRequest) {
  return NextResponse.json(
    {
      error: "Not Found",
      message: `API endpoint '${req.nextUrl.pathname}' does not exist.`,
      status: 404,
    },
    { status: 404 }
  );
}

export async function DELETE(req: NextRequest) {
  return NextResponse.json(
    {
      error: "Not Found",
      message: `API endpoint '${req.nextUrl.pathname}' does not exist.`,
      status: 404,
    },
    { status: 404 }
  );
}

export async function PATCH(req: NextRequest) {
  return NextResponse.json(
    {
      error: "Not Found",
      message: `API endpoint '${req.nextUrl.pathname}' does not exist.`,
      status: 404,
    },
    { status: 404 }
  );
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
    },
  });
}
