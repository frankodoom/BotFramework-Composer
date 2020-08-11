// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Request, Response } from 'express';

import { PluginManager } from '@bfc/plugin-loader';

interface AddPluginRequest extends Request {
  body: {
    name?: string;
    version?: string;
  };
}

interface TogglePluginRequest extends Request {
  body: {
    id?: string;
    enabled?: boolean;
  };
}

interface RemovePluginRequest extends Request {
  body: {
    id?: string;
  };
}

interface SearchPluginsRequest extends Request {
  query: {
    q?: string;
  };
}

interface PluginViewBundleRequest extends Request {
  params: {
    id: string;
    view: string;
  };
}

export async function listPlugins(req: Request, res: Response) {
  res.json(PluginManager.getInstance().getAll()); // might need to have this list all enabled plugins ?
}

export async function addPlugin(req: AddPluginRequest, res: Response) {
  const { name, version } = req.body;

  if (!name) {
    res.status(400).send({ error: '`name` is missing from body' });
    return;
  }

  await PluginManager.getInstance().install(name, version);
  await PluginManager.getInstance().load(name);
  res.json(PluginManager.getInstance().find(name));
}

export async function togglePlugin(req: TogglePluginRequest, res: Response) {
  const { id, enabled } = req.body;

  if (!id) {
    res.status(400).json({ error: '`id` is missing from body' });
    return;
  }

  if (!PluginManager.getInstance().find(id)) {
    res.status(404).json({ error: `plugin \`${id}\` not found` });
    return;
  }

  if (enabled === true) {
    await PluginManager.getInstance().enable(id);
  } else {
    await PluginManager.getInstance().disable(id);
  }

  res.json(PluginManager.getInstance().find(id));
}

export async function removePlugin(req: RemovePluginRequest, res: Response) {
  const { id } = req.body;

  if (!id) {
    res.status(400).send({ error: '`id` is missing from body' });
    return;
  }

  if (!PluginManager.getInstance().find(id)) {
    res.status(404).json({ error: `plugin \`${id}\` not found` });
    return;
  }

  await PluginManager.getInstance().remove(id);
  res.json(PluginManager.getInstance().getAll()); // might need to have this list all enabled plugins ?
}

export async function searchPlugins(req: SearchPluginsRequest, res: Response) {
  const { q } = req.query;

  const results = await PluginManager.getInstance().search(q ?? '');
  res.json(results);
}

export async function getBundleForView(req: PluginViewBundleRequest, res: Response) {
  const { id, view } = req.params;
  const plugin = PluginManager.getInstance().find(id);
  const bundleId = plugin.contributes.views?.[view].bundleId as string;
  const bundle = PluginManager.getInstance().getBundle(id, bundleId);
  if (bundle) {
    res.sendFile(bundle);
  } else {
    res.status(404);
  }
}
