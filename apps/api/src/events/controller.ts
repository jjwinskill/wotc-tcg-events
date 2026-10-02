import type { Request, RequestHandler } from 'express';
import { CreateEventInput, EventRange, RegisterInput } from '@app/shared';
import type { EventService } from './service.ts';

type Handler = RequestHandler<{ id: string }>;

export const createEventController = (events: EventService, publicWebUrl?: string) => {
  const webOrigin = (req: Request<{ id: string }>) => publicWebUrl ?? `${req.protocol}://${req.host}`;

  const list: Handler = async (req, res) => {
    res.json(await events.list(EventRange.parse(req.query)));
  };
  const create: Handler = async (req, res) => {
    res.status(201).json(await events.create(CreateEventInput.parse(req.body ?? {}), webOrigin(req)));
  };
  const get: Handler = async (req, res) => {
    res.json(await events.get(req.params.id, webOrigin(req)));
  };
  const invite: Handler = async (req, res) => {
    const { filename, ics } = await events.invite(req.params.id);
    res.attachment(filename).type('text/calendar; charset=utf-8').send(ics);
  };
  const register: Handler = async (req, res) => {
    res.status(201).json(await events.register(req.params.id, RegisterInput.parse(req.body ?? {})));
  };

  return { list, create, get, invite, register };
};
