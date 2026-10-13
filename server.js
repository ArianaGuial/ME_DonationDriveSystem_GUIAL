const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

if (!fs.existsSync(DATA_FILE)) 
{
  fs.writeFileSync(DATA_FILE, '[]');
}

function readData() 
{
  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(raw);
}

function writeData(data) 
{
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

app.get('/api/campaigns', function(req, res) 
{
  const campaigns = readData();
  res.json(campaigns);
});

app.get('/api/campaigns/:id', function(req, res) 
{
  const id = parseInt(req.params.id);
  const campaigns = readData();

  const campaign = campaigns.find(function(c) 
  {
    return c.id === id;
  });

  if (!campaign) 
  {
    return res.status(404).json({ error: 'Campaign not found' });
  }

  res.json(campaign);
});

app.post('/api/campaigns', function(req, res) 
{
  const campaign_name = req.body.campaign_name;
  const target_amount = req.body.target_amount;
  const collected_amount = req.body.collected_amount;
  const deadline = req.body.deadline;

  if (!campaign_name || target_amount === undefined || collected_amount === undefined || !deadline) 
  {
    return res.status(400).json({ error: 'Please fill in all fields.' });
  }

  const target = parseFloat(target_amount);
  const collected = parseFloat(collected_amount);

  if (isNaN(target) || isNaN(collected)) 
  {
    return res.status(400).json({ error: 'Amounts must be valid numbers.' });
  }

  if (collected > target) 
  {
    return res.status(400).json({ error: 'Collected amount cannot exceed the target amount.' });
  }

  const campaigns = readData();
  let newId = 1;

  if (campaigns.length > 0) 
  {
    newId = Math.max.apply(null, campaigns.map(function(c) { return c.id; })) + 1;
  }

  const newCampaign = 
  {
    id: newId,
    campaign_name: campaign_name,
    target_amount: target,
    collected_amount: collected,
    deadline: deadline
  };

  campaigns.push(newCampaign);
  writeData(campaigns);

  res.status(201).json(newCampaign);
});

app.delete('/api/campaigns/:id', function(req, res) 
{
  const id = parseInt(req.params.id);
  const campaigns = readData();
  const index = campaigns.findIndex(function(c) { return c.id === id; });

  if (index === -1) 
  {
    return res.status(404).json({ error: 'Campaign not found' });
  }

  campaigns.splice(index, 1);
  writeData(campaigns);

  res.json({ message: 'Campaign deleted' });
});

app.listen(port, function() 
{
  console.log('Server is running at http://localhost:' + port);
});