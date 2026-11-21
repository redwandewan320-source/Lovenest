One-time Super Admin setup
Create your own account through the LoveNest /login page.
In Supabase Dashboard, open Authentication -> Users and copy your account UUID.
Open SQL Editor and run this, replacing the UUID with your own:
insert into public.user_roles (user_id, role)
values ('YOUR-AUTH-USER-UUID', 'super_admin')
on conflict (user_id)
do update set role = 'super_admin';
Never create a public signup form for admin roles. Never let a browser update user_roles. Keep this SQL private and only run it for an account you control.
