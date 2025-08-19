"use client"

import * as React from "react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type GameRow = {
  id: string
  canonical_title: string
  status: string
  first_release_date: string | null
}

export function GamesTable({ games }: { games: GameRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Games</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>First release</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {games.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    No games to display
                  </TableCell>
                </TableRow>
              ) : (
                games.map((g) => (
                  <TableRow key={g.id}>
                    <TableCell className="font-medium">{g.canonical_title}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {g.status.replaceAll("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>{g.first_release_date ?? "-"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}


