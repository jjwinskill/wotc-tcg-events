import type { Request, RequestHandler } from 'express';
import { CreateEventInput, EventRange, RegisterInput, type EventDetail } from '@app/shared';
import type { EventService } from './service.ts';

type Handler = RequestHandler<{ id: string }>;

export const createEventController = (events: EventService, publicWebUrl?: string) => {
  const withRegistrationUrl = (req: Request<{ id: string }>, e: Omit<EventDetail, 'registrationUrl'>): EventDetail => ({
    ...e,
    registrationUrl: `${publicWebUrl ?? `${req.protocol}://${req.host}`}/events/${e.id}/register`,
  });

  const list: Handler = async (req, res) => {
    res.json(await events.list(EventRange.parse(req.query)));
  };
  const create: Handler = async (req, res) => {
    res.status(201).json(withRegistrationUrl(req, await events.create(CreateEventInput.parse(req.body ?? {}))));
  };
  const get: Handler = async (req, res) => {
    res.json(withRegistrationUrl(req, await events.get(req.params.id)));
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
